# encoding: utf-8
require_relative '../../geocoder/lib/geocoder'

module CartoDB
  class TableGeocoder

    attr_reader   :connection, :working_dir, :geocoder, :result, :temp_table_name

    attr_accessor :table_name, :formatter, :remote_id

    def initialize(arguments)
      @connection  = arguments.fetch(:connection)
      @working_dir = arguments[:working_dir] || Dir.mktmpdir
      `chmod 777 #{@working_dir}`
      @table_name  = arguments[:table_name]
      @formatter   = arguments[:formatter]
      @remote_id   = arguments[:remote_id]
      @schema      = arguments[:schema] || 'cdb'
      @geocoder    = CartoDB::Geocoder.new(
        app_id:     arguments[:app_id],
        token:      arguments[:token],
        mailto:     arguments[:mailto],
        dir:        @working_dir,
        request_id: arguments[:remote_id]
      )
    end # initialize

    def run
      csv_file = generate_csv
      start_geocoding_job(csv_file)
    end

    def generate_csv
      csv_file = File.join(working_dir, "wadus.csv")
      connection.run(%Q{
        COPY (
          SELECT concat_ws(', ', #{formatter}) as recId, concat_ws(', ', #{formatter}) as searchText 
          FROM #{table_name}
          GROUP BY recId
        ) TO '#{csv_file}' DELIMITER ',' CSV HEADER
      })
      return csv_file
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
      raise out unless $?.exitstatus == 0
      out = `unp #{working_dir}/*_out.zip 2>&1`
      raise out unless $?.exitstatus == 0
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
      connection.run(%Q{
        COPY #{temp_table_name}
        FROM '#{Dir[File.join(working_dir, '*_out.txt')][0]}' 
        DELIMITER ',' CSV
      })
    end

    def load_results_into_original_table
      connection.run(%Q{
        UPDATE #{table_name} AS dest
        SET the_geom = ST_GeomFromText(
            'POINT(' || orig.displayLongitude || ' ' ||
              orig.displayLatitude || ')', 4326
            )
        FROM #{temp_table_name} AS orig
        WHERE concat_ws(', ', #{formatter}) = orig.recId
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

  end # Geocoder
end # CartoDB
