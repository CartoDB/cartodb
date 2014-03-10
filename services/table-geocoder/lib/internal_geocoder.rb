# encoding: utf-8
require_relative '../../sql-api/sql_api'

module CartoDB
  class InternalGeocoder
    class NotImplementedError < StandardError; end

    attr_reader   :connection, :temp_table_name, :sql_api, :geocoding_results,
                  :working_dir, :remote_id, :state, :processed_rows

    attr_accessor :table_name, :column_name

    SQL_PATTERNS = {
      point: {
        namedplace: 'WITH geo_function AS (SELECT (geocode_namedplace(Array[{search_terms}], null, {country_list})).*) SELECT q, null, geom, success FROM geo_function',
        ipaddress:  'WITH geo_function AS (SELECT (geocode_ip(Array[{search_terms}])).*) SELECT q, null, geom, success FROM geo_function',
        postalcode: 'WITH geo_function AS (SELECT (geocode_postalcode_points(Array[{search_terms}], {country_list})).*) SELECT q, null, geom, success FROM geo_function'
      },
      polygon: {
        admin0:     'WITH geo_function AS (SELECT (geocode_admin0_polygons(Array[{search_terms}])).*) SELECT q, null, geom, success FROM geo_function',
        admin1:     'WITH geo_function AS (SELECT (geocode_admin1_polygons(Array[{search_terms}], {country_list})).*) SELECT q, null, geom, success FROM geo_function',
        postalcode: 'WITH geo_function AS (SELECT (geocode_postalcode_polygons(Array[{search_terms}], {country_list})).*) SELECT q, null, geom, success FROM geo_function'
      }
    }

    def initialize(arguments)
      @sql_api           = CartoDB::SQLApi.new arguments.fetch(:internal)
      @connection        = arguments.fetch(:connection)
      @working_dir       = Dir.mktmpdir
      `chmod 777 #{@working_dir}`
      @table_name        = arguments[:table_name]
      @column_name       = arguments[:formatter]
      @countries         = arguments[:countries].to_s
      @geometry_type     = arguments.fetch(:geometry_type, '').to_sym
      @kind              = arguments.fetch(:kind, '').to_sym
      @schema            = arguments[:schema] || 'cdb'
      @batch_size        = (@geometry_type == :point ? 5000 : 10)
      @state             = 'submitted'
      @geocoding_results = File.join(working_dir, "#{temp_table_name}_results.csv")
    end # initialize

    def run
      @state = 'processing'
      download_results
      create_temp_table
      load_results_to_temp_table
      add_georef_status_column
      copy_results_to_table
      @state = 'completed'
    rescue => e
      @state = 'failed'
      raise e
    ensure
      drop_temp_table
    end

    def download_results
      begin
        count = count + 1 rescue 0
        search_terms = get_search_terms(count)
        sql = generate_sql(search_terms)
        response = sql_api.fetch(sql, 'csv').gsub(/\A.*/, '').gsub(/^$\n/, '')
        File.open(geocoding_results, 'a') { |f| f.write(response.force_encoding("UTF-8")) } unless response == "\n"
      end while search_terms.size >= @batch_size
      @processed_rows = `wc -l #{geocoding_results} 2>&1`.to_i
      geocoding_results
    end # download_results

    def generate_sql(search_terms)
      SQL_PATTERNS.fetch(@geometry_type).fetch(@kind)
        .gsub('{search_terms}', search_terms.join(','))
        .gsub('{country_list}', "'#{@countries}'")
    rescue KeyError => e
      raise NotImplementedError.new("Can't find geocoding function for #{@geometry_type}, #{@kind}")
    end # generate_sql

    def get_search_terms(page)
      connection.fetch(%Q{
          SELECT DISTINCT(quote_nullable(#{column_name})) AS searchtext
          FROM #{table_name}
          LIMIT #{@batch_size} OFFSET #{page * @batch_size}
      }).all.map { |r| r[:searchtext] }
    end # get_search_terms

    def create_temp_table
      connection.run(%Q{
        CREATE TABLE #{temp_table_name} (
          geocode_string text, iso3 text, the_geom geometry, cartodb_georef_status boolean
        );
      })
    end # create_temp_table

    def update_geocoding_status
      { processed_rows: processed_rows, state: state }
    end # update_geocoding_status

    def process_results; end
    def cancel; end

    def load_results_to_temp_table
      connection.copy_into(temp_table_name.lit, data: File.read(geocoding_results), format: :csv)
    end # load_results_to_temp_table

    def copy_results_to_table
      connection.run(%Q{
        UPDATE #{table_name} AS dest
        SET the_geom = orig.the_geom, cartodb_georef_status = orig.cartodb_georef_status
        FROM #{temp_table_name} AS orig
        WHERE #{column_name} = orig.geocode_string
      })
    end # copy_results_to_table

    def drop_temp_table
      connection.run("DROP TABLE IF EXISTS #{temp_table_name}")
    end # drop_temp_table

    def temp_table_name
      @temp_table_name ||= "internal_geocoding_#{Time.now.to_i}"
    end # temp_table_name

    def add_georef_status_column
      connection.run(%Q{
        ALTER TABLE #{table_name} 
        ADD COLUMN cartodb_georef_status BOOLEAN DEFAULT NULL
      })
    rescue Sequel::DatabaseError => e
      raise unless e.message =~ /column .* of relation .* already exists/
      cast_georef_status_column
    end

    def cast_georef_status_column
      connection.run(%Q{
        ALTER TABLE #{table_name} ALTER COLUMN cartodb_georef_status 
        TYPE boolean USING cast(cartodb_georef_status as boolean)
      })
    rescue => e
      raise "Error converting cartodb_georef_status to boolean, please, convert it manually or remove it."
    end

  end # InternalGeocoder
end # CartoDB
