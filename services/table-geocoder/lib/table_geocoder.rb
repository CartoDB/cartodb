# encoding: utf-8
require_relative '../../geocoder/lib/geocoder'
require_relative 'geocoder_cache'
require_relative 'abstract_table_geocoder'

module CartoDB
  class TableGeocoder < AbstractTableGeocoder

    attr_reader   :connection, :working_dir, :geocoder, :result, 
                  :temp_table_name, :max_rows, :cache

    attr_accessor :table_name, :formatter, :remote_id

    def initialize(arguments)
      super(arguments)
      @working_dir = arguments[:working_dir] || Dir.mktmpdir
      `chmod 777 #{@working_dir}`
      @formatter   = arguments[:formatter]
      @remote_id   = arguments[:remote_id]
      @max_rows    = arguments[:max_rows] || 1000000
      @geocoder    = CartoDB::Geocoder.new(
        app_id:             arguments[:app_id],
        token:              arguments[:token],
        mailto:             arguments[:mailto],
        dir:                @working_dir,
        request_id:         arguments[:remote_id],
        base_url:           arguments[:base_url],
        non_batch_base_url: arguments[:non_batch_base_url]
      )
      @cache       = CartoDB::GeocoderCache.new(
        connection:  connection,
        formatter:   clean_formatter,
        sql_api:     arguments[:cache],
        working_dir: working_dir,
        table_name:  table_name,
        qualified_table_name: @qualified_table_name,
        max_rows:    @max_rows
      )
    end # initialize

    def run
      add_georef_status_column
      cache.run
      mark_rows_to_geocode
      csv_file = generate_csv
      start_geocoding_job(csv_file)
    end

    # Mark the rows to be sent with cartodb_georef_status = FALSE
    # This is necessary for cache.store to work correctly.
    def mark_rows_to_geocode
      connection.run(%Q{
        UPDATE #{@qualified_table_name} SET cartodb_georef_status = FALSE
        WHERE (cartodb_georef_status IS NULL)
        AND (cartodb_id IN (SELECT cartodb_id FROM #{@qualified_table_name} WHERE (cartodb_georef_status IS NULL) LIMIT #{@max_rows - cache.hits}))
      })
    end

    # Generate a csv input file from the geocodable rows
    def generate_csv
      csv_file = File.join(working_dir, "wadus.csv")
      # INFO: we exclude inputs too short and "just digits" inputs, which will remain as georef_status = false
      query = %Q{
        WITH geocodable AS (
          SELECT DISTINCT(#{clean_formatter}) recId, #{clean_formatter} searchText
          FROM #{@qualified_table_name}
          WHERE cartodb_georef_status = FALSE
          LIMIT #{@max_rows - cache.hits}
        )
        SELECT * FROM geocodable
        WHERE length(searchText) > 3 AND searchText !~ '^[\\d]*$'
      }
      result = connection.copy_table(connection[query], format: :csv, options: 'HEADER')
      File.write(csv_file, result.force_encoding("UTF-8"))
      return csv_file
    end

    def update_geocoding_status
      geocoder.update_status
      { processed_rows: geocoder.processed_rows, state: geocoder.status }
    end

    def clean_formatter
      "trim(both from regexp_replace(regexp_replace(concat(#{formatter}), E'[\\n\\r]+', ' ', 'g'), E'\"', '', 'g'))"
    end

    def cancel
      geocoder.cancel
    end

    def start_geocoding_job(csv_file)
      geocoder.input_file = csv_file
      geocoder.upload
      self.remote_id = geocoder.request_id
    end

    def process_results
      download_results
      deflate_results
      create_temp_table
      import_results_to_temp_table
      load_results_into_original_table
      cache.store
    ensure
      drop_temp_table
    end

    def download_results
      @result = geocoder.result
    end

    def deflate_results
      current_directory = Dir.pwd
      Dir.chdir(working_dir)
      out = `unp *.zip 2>&1`
      out = `unp #{working_dir}/*_out.zip 2>&1`
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
            cartodb_georef_status = true
        FROM #{temp_table_name} AS orig
        WHERE #{clean_formatter} = orig.recId
      })
    end

    def temp_table_name
      return nil unless remote_id
      @temp_table_name = "#{@schema}.geo_#{remote_id}"
      count = 0
      while connection.table_exists?(@temp_table_name) do
        count = count + 1
        @temp_table_name = @temp_table_name.sub(/(\_\d+)*$/, "_#{count}")
      end
      return @temp_table_name
    end

    def deflated_results_path
      Dir[File.join(working_dir, '*_out.txt')][0]
    end

    def used_batch_request?
      return geocoder.used_batch_request?
    end

  end # Geocoder
end # CartoDB
