# encoding: utf-8
require 'typhoeus'

module CartoDB
  class GeocoderCache

    DEFAULT_BATCH_SIZE = 5000
    DEFAULT_MAX_ROWS   = 1000000

    attr_reader :connection, :working_dir, :table_name, :hits,
                :max_rows, :sql_api, :formatter, :cache_results

    def initialize(arguments)
      @sql_api       = arguments.fetch(:sql_api)
      @connection    = arguments.fetch(:connection)
      @table_name    = arguments.fetch(:table_name)
      @qualified_table_name = arguments.fetch(:qualified_table_name)
      @working_dir   = arguments[:working_dir] || Dir.mktmpdir
      `chmod 777 #{@working_dir}`
      @formatter     = arguments.fetch(:formatter)
      @max_rows      = arguments[:max_rows] || DEFAULT_MAX_ROWS
      @cache_results = nil
      @batch_size    = arguments[:batch_size] || DEFAULT_BATCH_SIZE
      @cache_results = File.join(working_dir, "#{temp_table_name}_results.csv")
      @hits          = 0
    end # initialize

    def run
      get_cache_results
      create_temp_table
      load_results_to_temp_table
      @hits = connection.select.from(temp_table_name).where('longitude is not null and latitude is not null').count.to_i
      copy_results_to_table
    rescue => e
      handle_cache_exception e
    end # run

    def get_cache_results
      begin
        count = count + 1 rescue 0
        sql   = "WITH addresses(address) AS (VALUES "
        limit = [@batch_size, @max_rows - (count * @batch_size)].min
        rows = connection.fetch(%Q{
            SELECT DISTINCT(md5(#{formatter})) AS searchtext
            FROM #{@qualified_table_name}
            WHERE cartodb_georef_status IS NULL
            LIMIT #{limit} OFFSET #{count * @batch_size}
        }).all
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
          WHERE orig.cartodb_georef_status IS NOT NULL
          LIMIT #{@batch_size} OFFSET #{count * @batch_size}
        }).all
        rows.reject! { |r| r[:the_geom] == nil }
        sql.gsub! '%%VALUES%%', rows.map { |r| "(#{r[:searchtext]}, '#{r[:the_geom]}')" }.join(',')
        run_query(sql) if rows && rows.size > 0
      end while rows.size >= @batch_size
    rescue => e
      handle_cache_exception e
    ensure
      drop_temp_table
    end # store

    def create_temp_table
      connection.run(%Q{
        CREATE TABLE #{temp_table_name} (
          longitude text, latitude text, geocode_string text
        );
      })
    end # create_temp_table

    def load_results_to_temp_table
      connection.copy_into(temp_table_name.lit, data: File.read(cache_results), format: :csv)
    end # load_results_to_temp_table

    def copy_results_to_table
      connection.run(%Q{
        UPDATE #{@qualified_table_name} AS dest
        SET the_geom = ST_GeomFromText(
              'POINT(' || orig.longitude || ' ' || orig.latitude || ')', 4326
            ),
            cartodb_georef_status = true
        FROM #{temp_table_name} AS orig
        WHERE #{formatter} = orig.geocode_string
      })
    end # copy_results_to_table

    def drop_temp_table
      connection.run("DROP TABLE IF EXISTS #{temp_table_name}")
    end # drop_temp_table

    def temp_table_name
      @temp_table_name ||= "geocoding_cache_#{Time.now.to_i}"
    end # temp_table_name

    def run_query(query, format = '')
      params = { q: query, api_key: sql_api[:api_key], format: format }
      response = Typhoeus.post(
        sql_api[:base_url],
        body: URI.encode_www_form(params)
      )
      response.body
    end # run_query

    def handle_cache_exception(exception)
      drop_temp_table
      ::Rollbar.report_exception(exception)
    rescue => e
      raise exception
    end

  end # GeocoderCache
end # CartoDB
