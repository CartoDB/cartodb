# encoding: utf-8
require_relative '../../sql-api/sql_api'
require_relative 'internal-geocoder/query_generator_factory'

module CartoDB
  module InternalGeocoder

    class Geocoder
      class NotImplementedError < StandardError; end

      SQLAPI_CALLS_TIMEOUT = 45

      attr_reader   :connection, :temp_table_name, :sql_api, :geocoding_results,
                    :working_dir, :remote_id, :state, :processed_rows, :country_column, :region_column,
                    :qualified_table_name, :batch_size, :countries, :regions, :kind, :geometry_type

      attr_accessor :table_schema, :table_name, :column_name

      def initialize(arguments)
        @sql_api              = CartoDB::SQLApi.new(arguments.fetch(:internal)
                                                             .merge({ timeout: SQLAPI_CALLS_TIMEOUT })
                                                   )
        @connection           = arguments.fetch(:connection)
        @working_dir          = Dir.mktmpdir
        @table_name           = arguments[:table_name]
        @table_schema         = arguments[:table_schema]
        @qualified_table_name = arguments[:qualified_table_name]
        @column_name          = arguments[:formatter]
        @countries            = arguments[:countries].to_s
        @country_column       = arguments[:country_column]
        @regions              = arguments[:regions].to_s
        @region_column        = arguments[:region_column]
        @geometry_type        = arguments.fetch(:geometry_type, '').to_sym
        @kind                 = arguments.fetch(:kind, '').to_sym
        @schema               = arguments[:schema] || 'cdb'
        @batch_size           = (@geometry_type == :point ? 1000 : 10)
        @state                = 'submitted'
        @geocoding_results = File.join(working_dir, "#{temp_table_name}_results.csv")
        @query_generator = CartoDB::InternalGeocoder::QueryGeneratorFactory.get self
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
        FileUtils.remove_entry_secure @working_dir
      end

      def download_results
        begin
          count = count + 1 rescue 0
          search_terms = get_search_terms(count)
          unless search_terms.size == 0
            sql = @query_generator.dataservices_query(search_terms)
            response = sql_api.fetch(sql, 'csv').gsub(/\A.*/, '').gsub(/^$\n/, '')
            File.open(geocoding_results, 'a') { |f| f.write(response.force_encoding("UTF-8")) } unless response == "\n"
          end
        end while search_terms.size >= @batch_size
        @processed_rows = `wc -l #{geocoding_results} 2>&1`.to_i
        geocoding_results
      end # download_results

      def get_search_terms(page)
        query = @query_generator.search_terms_query(page)
        connection.fetch(query).all
      end # get_search_terms

      def create_temp_table
        connection.run(%Q{
          CREATE TABLE #{temp_table_name} (
            geocode_string text, country text, region text, the_geom geometry, cartodb_georef_status boolean
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
        # 'InternalGeocoder::copy_results_to_table'
        CartodbIdQueryBatcher.new(
            connection,
            nil,
            create_seq_field = true,
            batch_size
          ).execute_update(
            @query_generator.copy_results_to_table_query,
            @table_schema, @table_name
          )
      end

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

      def used_batch_request?
        # Only used for hi-res geocoding
        false
      end


    end # Geocoder

  end # InternalGeocoder
end # CartoDB
