# encoding: utf-8
require_relative '../../sql-api/sql_api'
require_relative 'internal_geocoder_query_generator'

module CartoDB
  class InternalGeocoder
    class NotImplementedError < StandardError; end

    attr_reader   :connection, :temp_table_name, :sql_api, :geocoding_results,
                  :working_dir, :remote_id, :state, :processed_rows

    attr_accessor :table_schema, :table_name, :column_name, :country_column, :qualified_table_name, :batch_size

    def initialize(arguments)
      @sql_api              = CartoDB::SQLApi.new arguments.fetch(:internal)
      @connection           = arguments.fetch(:connection)
      @working_dir          = Dir.mktmpdir
      `chmod 777 #{@working_dir}`
      @table_name           = arguments[:table_name]
      @table_schema         = arguments[:table_schema]
      @qualified_table_name = arguments[:qualified_table_name]
      @column_name          = arguments[:formatter]
      @countries            = arguments[:countries].to_s
      @geometry_type        = arguments.fetch(:geometry_type, '').to_sym
      @kind                 = arguments.fetch(:kind, '').to_sym
      @schema               = arguments[:schema] || 'cdb'
      @batch_size           = (@geometry_type == :point ? 5000 : 10)
      @state                = 'submitted'
      @geocoding_results = File.join(working_dir, "#{temp_table_name}_results.csv")
      @country_column = arguments[:country_column]
      @query_generator = CartoDB::InternalGeocoderQueryGenerator.new self
    end # initialize

    def run
      @state = 'processing'
      add_georef_status_column
      download_results
      create_temp_table
      load_results_to_temp_table
      copy_results_to_table
      @state = 'completed'
    rescue => e
      @state = 'failed'
      raise e
    ensure
      drop_temp_table
    end

    def column_datatype
      @column_datatype ||= connection.fetch(%Q{
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = '#{table_schema}' AND table_name='#{table_name}' AND column_name='#{column_name}'
      }).first[:data_type]
    end

    def download_results
      begin
        count = count + 1 rescue 0
        search_terms = get_search_terms(count)
        unless search_terms.size == 0
          sql = generate_sql(search_terms)
          response = sql_api.fetch(sql, 'csv').gsub(/\A.*/, '').gsub(/^$\n/, '')
          File.open(geocoding_results, 'a') { |f| f.write(response.force_encoding("UTF-8")) } unless response == "\n"
        end
      end while search_terms.size >= @batch_size
      @processed_rows = `wc -l #{geocoding_results} 2>&1`.to_i
      geocoding_results
    end # download_results

    def generate_sql(search_terms)
      query_template = @query_generator.dataservices_query_template
      #TODO move this to QueryGenerator
      query_template.gsub('{cities}', search_terms.join(',')).gsub('{country}', @countries)
    rescue KeyError => e
      raise NotImplementedError.new("Can't find geocoding function for #{@geometry_type}, #{@kind}")
    end # generate_sql

    def get_search_terms(page)
      query = @query_generator.search_terms_query(page)

      # TODO possibly casting is not this class' responsibility
      case column_datatype
      when 'double precision'
        connection.fetch(query).all.map { |r| r[:searchtext].to_i }
      when 'text'
        connection.fetch(query).all.map { |r| r[:searchtext] }
      else
        raise NotImplementedError.new("Source column #{ column_name } has an unsupported data type (#{ column_datatype })")
      end
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
      connection.run(@query_generator.copy_results_to_table_query)
    end # copy_results_to_table

    def drop_temp_table
      connection.run("DROP TABLE IF EXISTS #{temp_table_name}")
    end # drop_temp_table

    def temp_table_name
      @temp_table_name ||= "internal_geocoding_#{Time.now.to_i}"
    end # temp_table_name

    def add_georef_status_column
      connection.run(%Q{
        ALTER TABLE #{@qualified_table_name}
        ADD COLUMN cartodb_georef_status BOOLEAN DEFAULT NULL
      })
    rescue Sequel::DatabaseError => e
      raise unless e.message =~ /column .* of relation .* already exists/
      cast_georef_status_column
    end

    def cast_georef_status_column
      connection.run(%Q{
        ALTER TABLE #{@qualified_table_name} ALTER COLUMN cartodb_georef_status
        TYPE boolean USING cast(cartodb_georef_status as boolean)
      })
    rescue => e
      raise "Error converting cartodb_georef_status to boolean, please, convert it manually or remove it."
    end

  end # InternalGeocoder
end # CartoDB
