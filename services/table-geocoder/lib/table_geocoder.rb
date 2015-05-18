# encoding: utf-8
require_relative '../../geocoder/lib/geocoder'
require_relative 'geocoder_cache'

module CartoDB
  class TableGeocoder

    attr_reader   :connection, :working_dir, :geocoder, :result, 
                  :temp_table_name, :max_rows, :cache

    attr_accessor :table_name, :formatter, :remote_id

    def initialize(arguments)
      @connection  = arguments.fetch(:connection)
      @working_dir = arguments[:working_dir] || Dir.mktmpdir
      `chmod 777 #{@working_dir}`
      @table_name  = arguments[:table_name]
      @qualified_table_name = arguments[:qualified_table_name]
      @sequel_qualified_table_name = arguments[:sequel_qualified_table_name]
      @formatter   = arguments[:formatter]
      @remote_id   = arguments[:remote_id]
      @schema      = arguments[:schema] || 'cdb'
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
      csv_file = generate_csv
      connection.run(
        dataset.where('cartodb_id'.lit => dataset.select('cartodb_id'.lit))
          .update_sql('cartodb_georef_status = false')
      )
      start_geocoding_job(csv_file)
    end

    def generate_csv
      csv_file = File.join(working_dir, "wadus.csv")
      query = dataset.limit(@max_rows - cache.hits).select_sql
      result = connection.copy_table(connection[query], format: :csv, options: 'HEADER')
      File.write(csv_file, result.force_encoding("UTF-8"))
      return csv_file
    end

    def update_geocoding_status
      geocoder.update_status
      { processed_rows: geocoder.processed_rows, state: geocoder.status }
    end

    def dataset
      connection.select("DISTINCT(#{clean_formatter}) recId, #{clean_formatter} searchText".lit)
        .from(@sequel_qualified_table_name)
        .limit(max_rows)
        .where("cartodb_georef_status IS NULL".lit)
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

    def use_batch_process?
      return geocoder.use_batch_process?
    end

  end # Geocoder
end # CartoDB
