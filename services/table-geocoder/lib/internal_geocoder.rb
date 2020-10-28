require_relative '../../sql-api/sql_api'
require_relative '../../importer/lib/importer/query_batcher'
require_relative 'internal-geocoder/query_generator_factory'
require_relative 'abstract_table_geocoder'

module CartoDB
  module InternalGeocoder
    class Geocoder  < AbstractTableGeocoder

      SQLAPI_CALLS_TIMEOUT = 45

      attr_reader   :temp_table_name, :sql_api, :geocoding_results,
                    :working_dir, :remote_id, :state, :processed_rows, :country_column, :region_column,
                    :qualified_table_name, :batch_size, :countries, :regions, :kind, :geometry_type

      attr_accessor :table_schema, :table_name, :column_name, :log

      def initialize(arguments)
        super(arguments)
        @sql_api              = CartoDB::SQLApi.new(arguments.fetch(:internal)
                                                             .merge({ timeout: SQLAPI_CALLS_TIMEOUT })
                                                   )
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
        @geocoding_model = arguments[:geocoding_model]
        @usage_metrics = arguments.fetch(:usage_metrics)
      end

      def set_log(log)
        @log = log
      end

      def run
        log.append_and_store 'run()'
        change_status('running')
        ensure_georef_status_colummn_valid
        download_results
        create_temp_table
        load_results_to_temp_table
        copy_results_to_table
        change_status('completed')
      rescue StandardError => e
        change_status('failed')
        raise e
      ensure
        drop_temp_table
        FileUtils.remove_entry_secure @working_dir if Dir.exists?(@working_dir)
      end

      def download_results
        log.append_and_store 'download_results()'
        begin
          count = count + 1 rescue 0
          search_terms = get_search_terms(count)
          unless search_terms.size == 0
            sql = @query_generator.dataservices_query(search_terms)

            # Getting data from the internal geocoder is an all-or-nothing thing, so we
            # log it as such, total_requests and failed_responses
            begin
              response = sql_api.fetch(sql, 'csv').gsub(/\A.*/, '').gsub(/^$\n/, '')
            rescue CartoDB::SQLApi::SQLApiError => ex
              @usage_metrics.incr(:geocoder_internal, :failed_responses, search_terms.length)
              raise ex
            ensure
              @usage_metrics.incr(:geocoder_internal, :total_requests, search_terms.length)
            end

            # Count empty and successfully geocoded responses
            empty_responses = 0
            success_responses = 0
            CSV.parse(response.chomp) do |row|
              empty_responses += 1 if row[4] == "false"
              success_responses += 1 if row[4] == "true"
            end
            @usage_metrics.incr(:geocoder_internal, :success_responses, success_responses)
            @usage_metrics.incr(:geocoder_internal, :empty_responses, empty_responses)

            log.append_and_store "Saving results to #{geocoding_results}"
            File.open(geocoding_results, 'a') { |f| f.write(response.force_encoding("UTF-8")) } unless response.blank?
          end
        end while search_terms.size >= @batch_size
        @processed_rows = `wc -l '#{geocoding_results}' 2>&1`.to_i
        geocoding_results
      end # download_results

      def get_search_terms(page)
        query = @query_generator.search_terms_query(page)
        connection.fetch(query).all
      end # get_search_terms

      def create_temp_table
        log.append_and_store 'create_temp_table()'
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
        log.append_and_store 'load_results_to_temp_table()'
        connection.copy_into(Sequel.lit(temp_table_name), data: File.read(geocoding_results), format: :csv)
      end # load_results_to_temp_table

      def copy_results_to_table
        log.append_and_store 'copy_results_to_table()'
        # 'InternalGeocoder::copy_results_to_table'
        CartoDB::Importer2::QueryBatcher.new(
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
        @temp_table_name ||= %Q{"#{@table_schema}".internal_geocoding_#{Time.now.to_i}}
      end # temp_table_name

      def name
        'internal'
      end

      def change_status(status)
        @status = status
        @geocoding_model.state = status
        @geocoding_model.save
      end
    end
  end
end
