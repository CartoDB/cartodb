# encoding: utf-8
require_relative 'exceptions'
require_relative '../../../lib/carto/http/client'

module CartoDB
  class GeocoderCache

    DEFAULT_BATCH_SIZE = 5000
    DEFAULT_MAX_ROWS   = 1000000
    HTTP_CONNECT_TIMEOUT = 60
    HTTP_DEFAULT_TIMEOUT = 600

    attr_reader :connection, :working_dir, :table_name, :hits, :misses,
                :max_rows, :sql_api, :formatter, :cache_results

    def initialize(arguments)
      @sql_api = arguments.fetch(:sql_api)
      @connection = arguments.fetch(:connection)
      @table_name = arguments.fetch(:table_name)
      @qualified_table_name = arguments.fetch(:qualified_table_name)
      @working_dir = arguments[:working_dir] || Dir.mktmpdir
      `chmod 777 #{@working_dir}`
      @formatter = arguments.fetch(:formatter)
      @max_rows = arguments[:max_rows] || DEFAULT_MAX_ROWS
      @cache_results = nil
      @batch_size = arguments[:batch_size] || DEFAULT_BATCH_SIZE
      @cache_results = File.join(working_dir, "#{temp_table_name}_results.csv")
      @usage_metrics = arguments.fetch(:usage_metrics)
      @log = arguments.fetch(:log)
      init_rows_count
    end

    def run
      get_cache_results
      create_temp_table
      load_results_to_temp_table
      @hits = connection.select.from(temp_table_name).where('longitude is not null and latitude is not null').count.to_i
      copy_results_to_table
    rescue => e
      handle_cache_exception e
    ensure
      @usage_metrics.incr(:geocoder_cache, :total_requests, @total_rows)
      @usage_metrics.incr(:geocoder_cache, :success_responses, @hits)
      @usage_metrics.incr(:geocoder_cache, :empty_responses, (@total_rows - @hits - @failed_rows))
      @usage_metrics.incr(:geocoder_cache, :failed_responses, @failed_rows)
    end

    def get_cache_results
      begin
        count = count + 1 rescue 0
        limit = [@batch_size, @max_rows - (count * @batch_size)].min
        rows = connection.fetch(%Q{
            SELECT DISTINCT(md5(#{formatter})) AS searchtext
            FROM #{@qualified_table_name}
            WHERE cartodb_georef_status IS NULL
            LIMIT #{limit} OFFSET #{count * @batch_size}
        }).all
        @total_rows += rows.size
        sql   = "WITH addresses(address) AS (VALUES "
        sql << rows.map { |r| "('#{r[:searchtext]}')" }.join(',')
        sql << ") SELECT DISTINCT ON(geocode_string) st_x(g.the_geom) longitude, st_y(g.the_geom) latitude,g.geocode_string FROM addresses a INNER JOIN #{sql_api[:table_name]} g ON md5(g.geocode_string)=a.address"
        response = run_query(sql, 'csv').gsub(/\A.*/, '').gsub(/^$\n/, '')
        File.open(cache_results, 'a') { |f| f.write(response.force_encoding("UTF-8")) } unless response == "\n"
      end while rows.size >= @batch_size && (count * @batch_size) + rows.size < @max_rows
    end

    def store
      begin
        count = count + 1 rescue 0
        sql   = %Q{
           WITH
            -- write the new values
           n(searchtext, the_geom) AS (
              VALUES %%VALUES%%
           ),
            -- update existing rows
           upsert AS (
              UPDATE #{sql_api[:table_name]} o
              SET updated_at = NOW()
              FROM n WHERE o.geocode_string = n.searchtext
              RETURNING o.geocode_string
           )
           -- insert missing rows
           INSERT INTO #{sql_api[:table_name]} (geocode_string,the_geom)
           SELECT n.searchtext, n.the_geom FROM n
           WHERE n.searchtext NOT IN (
            SELECT geocode_string FROM upsert
           );
        }
        rows = connection.fetch(%Q{
          SELECT DISTINCT(quote_nullable(#{formatter})) AS searchtext, the_geom
          FROM #{@qualified_table_name} AS orig
          WHERE orig.cartodb_georef_status IS TRUE AND the_geom IS NOT NULL
          LIMIT #{@batch_size} OFFSET #{count * @batch_size}
        }).all
        sql.gsub! '%%VALUES%%', rows.map { |r| "(#{r[:searchtext]}, '#{r[:the_geom]}')" }.join(',')
        run_query(sql) if rows && rows.size > 0
      end while rows.size >= @batch_size
    rescue => e
      handle_cache_exception e
    ensure
      drop_temp_table
    end

    def create_temp_table
      connection.run(%Q{
        CREATE TABLE #{temp_table_name} (
          longitude text, latitude text, geocode_string text
        );
      })
    end

    def load_results_to_temp_table
      connection.copy_into(temp_table_name.lit, data: File.read(cache_results), format: :csv)
    end

    def copy_results_to_table
      connection.run(%Q{
        UPDATE #{@qualified_table_name} AS dest
        SET the_geom = ST_GeomFromText(
              'POINT(' || orig.longitude || ' ' || orig.latitude || ')', 4326
            ),
            cartodb_georef_status = TRUE
        FROM #{temp_table_name} AS orig
        WHERE #{formatter} = orig.geocode_string
      })
    end

    def drop_temp_table
      connection.run("DROP TABLE IF EXISTS #{temp_table_name}")
    end

    def temp_table_name
      @temp_table_name ||= "geocoding_cache_#{Time.now.to_i}"
    end

    def run_query(query, format = '')
      params = { q: query, api_key: sql_api[:api_key], format: format }
      http_client = Carto::Http::Client.get('geocoder_cache',
                                            log_requests: true,
                                            connecttimeout: HTTP_CONNECT_TIMEOUT,
                                            timeout: HTTP_DEFAULT_TIMEOUT)
      response = http_client.post(sql_api[:base_url],
                                  body: URI.encode_www_form(params))
      response.body
    end

    # It handles in such a way that the caching is silently stopped
    def handle_cache_exception(exception)
      drop_temp_table
      if exception.class == Sequel::DatabaseError && exception.message =~ /canceling statement due to statement timeout/
        # for the moment we just wrap the exception to get a specific error in rollbar
        exception =  Carto::GeocoderErrors::GeocoderCacheDbTimeoutError.new(exception)
      end
      # In case we get some error we are going to pass all the rows as failed
      @failed_rows = @total_rows
      CartoDB.notify_exception(exception)
    end

    private

    def init_rows_count
      @hits = 0
      @total_rows = 0
      @failed_rows = 0
    end
  end
end
