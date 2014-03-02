# encoding: utf-8
require_relative '../../geocoder/lib/geocoder'
require_relative 'geocoder_cache'

module CartoDB
  class InternalGeocoder

    attr_reader   :connection, :working_dir, :temp_table_name,
                  :sql_api, :cache_results

    attr_accessor :table_name, :column_name

    SQL_PATTERNS = {
      points: {
        named_places: 'SELECT (geocode_namedplace(Array[{search_terms}], Array[{country_list}])).*'
        ip_addresses: 'SELECT (geocode_ip(Array[{search_terms}])).*'
      },
      polygons: {
        admin0:       'SELECT (geocode_admin0_polygons(Array[{search_terms}])).*',
        admin1:       'SELECT (geocode_admin1_polygons(Array[{search_terms}], Array[{country_list}])).*',
        postal_codes: 'SELECT (geocode_postalcode_polygons(Array[{search_terms}], Array[{country_list}])).*'
      }
    }

    def initialize(arguments)
      @sql_api     = arguments.fetch(:sql_api)
      @connection  = arguments.fetch(:connection)
      @working_dir = arguments[:working_dir] || Dir.mktmpdir
      `chmod 777 #{@working_dir}`
      @table_name  = arguments[:table_name]
      @column_name = arguments[:column_name]
      @schema      = arguments[:schema] || 'cdb'
      @batch_size  = 5
      @cache_results = File.join(working_dir, "#{temp_table_name}_results.csv")
    end # initialize

    def run
      download_results
      create_temp_table
      load_results_to_temp_table
      copy_results_to_table
    end

    def download_results
      begin
        count = count + 1 rescue 0
        sql_pattern = SQL_PATTERNS[:polygons][:admin0]
        search_terms = get_search_terms(count)
        sql = sql_pattern.gsub '{search_terms}', search_terms.join(',')
        response = run_query(sql, 'csv').gsub(/\A.*/, '').gsub(/^$\n/, '')
        File.open(cache_results, 'a') { |f| f.write(response.force_encoding("UTF-8")) } unless response == "\n"
      end while search_terms.size >= @batch_size # && (count * @batch_size) + rows.size < @max_rows
      cache_results
    end # download_results

    def get_search_terms(page)
      limit = @batch_size #, @max_rows - (count * @batch_size)].min
      connection.fetch(%Q{
          SELECT DISTINCT(quote_nullable(#{column_name})) AS searchtext
          FROM #{table_name}
          LIMIT #{limit} OFFSET #{page * @batch_size}
      }).all.map { |r| r[:searchtext] }
    end # get_search_terms

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

  end # InternalGeocoder
end # CartoDB
