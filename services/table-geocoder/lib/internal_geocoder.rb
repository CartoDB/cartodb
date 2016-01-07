# encoding: utf-8
require 'csv'
require_relative '../../sql-api/sql_api'
require_relative '../../importer/lib/importer/query_batcher'
require_relative 'internal-geocoder/query_generator_factory'
require_relative 'abstract_table_geocoder'

module CartoDB
  module InternalGeocoder
    class Geocoder < AbstractTableGeocoder

      SQLAPI_CALLS_TIMEOUT = 45

      attr_reader :temp_table_name, :sql_api, :geocoding_results,
                  :working_dir, :remote_id, :state, :processed_rows, :successful_processed_rows,
                  :failed_processed_rows, :empty_processed_rows, :country_column, :region_column,
                  :qualified_table_name, :batch_size, :countries, :regions, :kind, :geometry_type

      attr_accessor :table_schema, :table_name, :column_name, :log

      def initialize(arguments)
        super(arguments)
        @sql_api              = CartoDB::SQLApi.new(arguments.fetch(:internal)
                                                             .merge(timeout: SQLAPI_CALLS_TIMEOUT))
        @column_name          = arguments[:formatter]
        @countries            = arguments[:countries].to_s
        @country_column       = arguments[:country_column]
        @regions              = arguments[:regions].to_s
        @region_column        = arguments[:region_column]
        @geometry_type        = arguments.fetch(:geometry_type, '').to_sym
        @kind                 = arguments.fetch(:kind, '').to_sym
        @batch_size           = (@geometry_type == :point ? 1000 : 10)
        @working_dir          = arguments[:working_dir] || Dir.mktmpdir
        @geocoding_results = File.join(working_dir, "#{temp_table_name}_results.csv".gsub('"', ''))
        @query_generator = CartoDB::InternalGeocoder::QueryGeneratorFactory.get self
        @log = arguments[:log]
        initialize_processed_rows_count
      end # initialize

      def set_log(log)
        @log = log
      end

      def run
        initialize_processed_rows_count
        log.append 'run()'
        @state = 'processing'
        ensure_georef_status_colummn_valid
        download_results
        create_temp_table
        load_results_to_temp_table
        copy_results_to_table
        @state = 'completed'
      rescue => e
        @state = 'failed'
        raise e
      ensure
        # INFO: Sometimes the ensure block is called twice
        drop_temp_table
        FileUtils.remove_entry_secure @working_dir if Dir.exists?(@working_dir)
      end

      def download_results
        log.append 'download_results()'
        begin
          count = count + 1 rescue 0
          search_terms = get_search_terms(count)
          unless search_terms.size == 0
            response = fetch_from_sql_api(search_terms)
            log.append "Saving results to #{geocoding_results}"
            update_stats(response, search_terms.size)
            File.open(geocoding_results, 'a') { |f| f.write(response.force_encoding("UTF-8")) } unless response == "\n"
          end
        end while search_terms.size >= @batch_size
        geocoding_results
      end

      def get_search_terms(page)
        query = @query_generator.search_terms_query(page)
        connection.fetch(query).all
      end

      def create_temp_table
        log.append 'create_temp_table()'
        connection.run(%{
          CREATE TABLE #{temp_table_name} (
            geocode_string text, country text, region text, the_geom geometry, cartodb_georef_status boolean
          );
        })
      end

      def update_geocoding_status
        {
          processed_rows: processed_rows,
          successful_processed_rows: successful_processed_rows,
          failed_processed_rows: failed_processed_rows,
          empty_processed_rows: empty_processed_rows,
          state: state
        }
      end

      def process_results; end

      def cancel; end

      def load_results_to_temp_table
        log.append 'load_results_to_temp_table()'
        connection.copy_into(temp_table_name.lit, data: File.read(geocoding_results), format: :csv)
      end

      def copy_results_to_table
        log.append 'copy_results_to_table()'
        # 'InternalGeocoder::copy_results_to_table'
        query_batcher = CartoDB::Importer2::QueryBatcher.new(connection, nil, create_seq_field = true, batch_size)
        query_batcher.execute_update(@query_generator.copy_results_to_table_query, @table_schema, @table_name)
      end

      def drop_temp_table
        connection.run("DROP TABLE IF EXISTS #{temp_table_name}")
      end

      def temp_table_name
        @temp_table_name ||= %{"#{@table_schema}".internal_geocoding_#{Time.now.to_i}}
      end

      def name
        'cdb_geocoder'
      end

      def update_stats(response, number_of_terms)
        @processed_rows += number_of_terms
        CSV.parse(response) do |row|
          if row[-1] == "true"
            @successful_processed_rows += 1
          else
            @empty_processed_rows += 1
          end
        end
      end

      private

      def fetch_from_sql_api(search_terms)
        sql = @query_generator.dataservices_query(search_terms)
        begin
          sql_api.fetch(sql, 'csv').gsub(/\A.*/, '').gsub(/^$\n/, '')
        rescue
          @failed_processed_rows += search_terms.size
        end
      end

      def initialize_processed_rows_count
        @processed_rows = 0
        @successful_processed_rows = 0
        @failed_processed_rows = 0
        @empty_processed_rows = 0
      end
    end
  end
end
