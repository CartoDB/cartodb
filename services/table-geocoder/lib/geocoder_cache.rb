# encoding: utf-8
require 'typhoeus'

module CartoDB
  class GeocoderCache

    BATCH_SIZE = 10

    attr_reader :connection, :working_dir, :table_name, :hits,
                :max_rows, :sql_api, :formatter, :cache_results

    def initialize(arguments)
      @sql_api       = arguments.fetch(:sql_api)
      @connection    = arguments.fetch(:connection)
      @table_name    = arguments.fetch(:table_name)
      @working_dir   = arguments.fetch(:working_dir)
      @formatter     = arguments.fetch(:formatter)
      @cache_results = nil
    end # initialize

    def run
      @cache_results = File.join(working_dir, "#{temp_table_name}_results.csv")
      begin
        count = count + 1 rescue 0
        sql   = "WITH addresses(address) AS (VALUES "
        rows = connection.fetch(%Q{
            SELECT md5(#{formatter}) AS searchtext
            FROM #{table_name}
            WHERE cartodb_georef_status IS false OR cartodb_georef_status IS NULL
            GROUP BY searchtext
            LIMIT #{BATCH_SIZE} OFFSET #{count * BATCH_SIZE}
        }).all
        sql << rows.map { |r| "('#{r[:searchtext]}')" }.join(',')
        sql << ") SELECT st_x(g.the_geom) longitude, st_y(g.the_geom) latitude,g.geocode_string FROM addresses a INNER JOIN #{sql_api[:table_name]} g ON md5(g.geocode_string)=a.address"
        response = run_query(sql, 'csv').gsub(/\A.*/, '').gsub(/^$\n/, '')
        File.open(cache_results, 'a') { |f| f.write(response) } unless response == "\n"
      end while rows.size >= BATCH_SIZE
      create_temp_table
      load_results_to_temp_table
      @hits = connection.fetch("SELECT count(*) FROM #{temp_table_name}").first[:count].to_i
      copy_results_to_table
    rescue => e
      drop_temp_table
      raise e
    end # run

    def store
      begin
        count = count + 1 rescue 0
        sql   = "INSERT INTO #{sql_api[:table_name]} (geocode_string, the_geom) VALUES "
        rows = connection.fetch(%Q{
          SELECT quote_nullable(#{formatter}) AS searchtext, the_geom 
          FROM #{table_name} AS orig
          WHERE orig.the_geom IS NOT null AND #{formatter} NOT IN (SELECT geocode_string FROM #{temp_table_name})
          LIMIT #{BATCH_SIZE} OFFSET #{count * BATCH_SIZE}
        }).all
        sql << rows.map { |r| "(#{r[:searchtext]}, '#{r[:the_geom]}')" }.join(',')
        run_query(sql)
      end while rows.size >= BATCH_SIZE
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
        UPDATE #{table_name} AS dest
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

  end # GeocoderCache
end # CartoDB
