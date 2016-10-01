# encoding: utf-8
require 'uuidtools'
require_relative '../../geocoder/lib/hires_geocoder_factory'
require_relative '../../geocoder/lib/geocoder_config'
require_relative 'geocoder_cache'
require_relative 'abstract_table_geocoder'


module CartoDB
  class TableGeocoder < AbstractTableGeocoder

    attr_reader   :working_dir, :csv_file, :result,
                  :max_rows, :cache

    attr_accessor :table_name, :formatter, :remote_id

    def initialize(arguments)
      super(arguments)
      @working_dir = arguments[:working_dir] || Dir.mktmpdir
      `chmod 777 #{@working_dir}`
      @formatter   = arguments[:formatter]
      @remote_id   = arguments[:remote_id]
      @max_rows    = arguments.fetch(:max_rows)
      @usage_metrics = arguments.fetch(:usage_metrics)
      @log = arguments.fetch(:log)
      @geocoding_model = arguments.fetch(:geocoding_model)
      @cache       = CartoDB::GeocoderCache.new(
        connection:  connection,
        formatter:   clean_formatter,
        sql_api:     arguments[:cache],
        working_dir: @working_dir,
        table_name:  table_name,
        qualified_table_name: @qualified_table_name,
        max_rows:    @max_rows,
        usage_metrics: @usage_metrics,
        log: @log
      )
    end

    def run
      ensure_georef_status_colummn_valid
      @number_of_rows_pre_cache = calculate_number_of_rows
      cache.run unless cache_disabled?
      @csv_file = generate_csv()
      geocoder.run
      # Sync state because cancel is made synchronous
      @geocoding_model.refresh
      if not @geocoding_model.cancelled?
        process_results if @geocoding_model.state == 'completed'
        cache.store unless cache_disabled?
      end
    ensure
      self.remote_id = @geocoding_model.remote_id
      update_metrics unless @geocoding_model.cancelled?
    end

    # TODO: make the geocoders update status directly in the model
    def update_geocoding_status
      geocoder.update_status
      { processed_rows: geocoder.processed_rows, state: geocoder.status }
    end

    def cancel
      # We have to be sure the cartodb_georef_status column exists
      ensure_georef_status_colummn_valid
      @number_of_rows_pre_cache = calculate_number_of_rows
      geocoder.cancel
    end

    def process_results
      download_results # TODO move to HiresBatchGeocoder
      deflate_results # TODO move to HiresBatchGeocoder
      create_temp_table
      import_results_to_temp_table
      load_results_into_original_table
      mark_rows_not_geocoded
    rescue Sequel::DatabaseError => e
      if e.message =~ /canceling statement due to statement timeout/
        # INFO: Timeouts here are not recoverable for batched geocodes, but they are for non-batched
        # INFO: cache.store relies on having results in the target table
        raise Carto::GeocoderErrors::TableGeocoderDbTimeoutError.new(e)
      else
        raise
      end
    ensure
      drop_temp_table
    end


    def used_batch_request?
      return geocoder.used_batch_request?
    end

    def name
      'heremaps'
    end

    private

    def geocoder
      @geocoder ||= CartoDB::HiresGeocoderFactory.get(@csv_file, @working_dir, @log, @geocoding_model,
                                                      @number_of_rows_pre_cache)
    end

    def cache_disabled?
      GeocoderConfig.instance.get['disable_cache'] || false
    end

    def calculate_number_of_rows
      rows = connection.fetch(%Q{
        SELECT count(DISTINCT(#{clean_formatter}))
        FROM #{@qualified_table_name}
        WHERE cartodb_georef_status IS NULL OR cartodb_georef_status IS FALSE
        LIMIT #{@max_rows}
      }).first
      rows[:count]
    end

    # Generate a csv input file from the geocodable rows
    def generate_csv
      csv_file = File.join(@working_dir, "wadus.csv")
      # INFO: we exclude inputs too short and "just digits" inputs, which will remain as georef_status = false
      query = %Q{
        WITH geocodable AS (
          SELECT DISTINCT(#{clean_formatter}) recId, #{clean_formatter} searchText
          FROM #{@qualified_table_name}
          WHERE cartodb_georef_status IS NULL
          LIMIT #{@max_rows - cache.hits}
        )
        SELECT * FROM geocodable
        WHERE length(searchText) > 3 AND searchText !~ '^[\\d]*$'
      }
      result = connection.copy_table(connection[query], format: :csv, options: 'HEADER')
      File.write(csv_file, result.force_encoding("UTF-8"))
      return csv_file
    end

    def clean_formatter
      "trim(both from regexp_replace(regexp_replace(concat(#{formatter}), E'[\\n\\r]+', ' ', 'g'), E'\"', '', 'g'))"
    end

    def download_results
      @result = geocoder.result
    end

    def deflate_results
      current_directory = Dir.pwd
      Dir.chdir(@working_dir)
      out = `unp *.zip 2>&1`
      out = `unp #{@working_dir}/*_out.zip 2>&1`
    ensure
      Dir.chdir(current_directory)
    end

    def create_temp_table
      connection.run(%Q{
        CREATE TABLE #{temp_table_name} (
          recId text,
          SeqNumber int,
          seqLength int,
          displayLatitude float,
          displayLongitude float
        );}
      )
    end

    def drop_temp_table
      connection.run("DROP TABLE IF EXISTS #{temp_table_name}")
    end

    def import_results_to_temp_table
      connection.copy_into(temp_table_name.lit, data: File.read(deflated_results_path), format: :csv)
    end

    def load_results_into_original_table
      connection.run(%Q{
        UPDATE #{@qualified_table_name} AS dest
        SET the_geom = ST_GeomFromText(
            'POINT(' || orig.displayLongitude || ' ' ||
              orig.displayLatitude || ')', 4326
            ),
            cartodb_georef_status = TRUE
        FROM #{temp_table_name} AS orig
        WHERE #{clean_formatter} = orig.recId
      })
    end

    def mark_rows_not_geocoded
      connection.run(%Q{UPDATE #{@qualified_table_name} SET cartodb_georef_status = FALSE WHERE cartodb_georef_status IS NULL})
    end

    def temp_table_name
      @temp_table_name ||= "#{@schema}.geo_#{UUIDTools::UUID.timestamp_create.to_s.gsub('-', '')}"
    end

    def deflated_results_path
      Dir[File.join(@working_dir, '*_out.txt')][0]
    end

    def update_metrics
      total_requests = geocoder.successful_processed_rows + geocoder.empty_processed_rows + geocoder.failed_processed_rows
      @usage_metrics.incr(:geocoder_here, :success_responses, geocoder.successful_processed_rows)
      @usage_metrics.incr(:geocoder_here, :empty_responses, geocoder.empty_processed_rows)
      @usage_metrics.incr(:geocoder_here, :failed_responses, geocoder.failed_processed_rows)
      @usage_metrics.incr(:geocoder_here, :total_requests, total_requests)
    end
  end
end
