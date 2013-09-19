# encoding: utf-8
require_relative '../../geocoder/lib/geocoder'

module CartoDB
  class TableGeocoder

    attr_reader   :connection, :working_dir, :geocoder

    attr_accessor :table_name, :formatter, :remote_id

    def initialize(arguments)
      @connection  = arguments.fetch(:connection)
      @working_dir = Dir.mktmpdir
      @table_name  = arguments[:table_name]
      @formatter   = arguments[:formatter]
      @remote_id   = arguments[:remote_id]
      @geocoder    = CartoDB::Geocoder.new(
        app_id:     arguments[:app_id],
        token:      arguments[:token],
        mailto:     arguments[:mailto],
        dir:        @working_dir,
        request_id: arguments[:remote_id]
      )
    end # initialize

    def run
      csv_file = generate_csv(table_name, formatter)
      start_geocoding_job(csv_file)
    end

    def generate_csv(table_name, formatter)
      csv_file = File.join(working_dir, "wadus.csv")
      connection.run(%Q{
        COPY (
          SELECT cartodb_id as recId, concat_ws(', ', #{formatter}) as searchText 
          FROM #{table_name}
        ) TO '#{csv_file}' DELIMITER ',' CSV HEADER
      })
      return csv_file
    end

    def start_geocoding_job(csv_file)
      geocoder.input_file = csv_file
      geocoder.upload
      remote_id = geocoder.request_id
    end

    def download_results
      @result = geocoder.result
    end

    def deflate_results
      current_directory = Dir.pwd
      Dir.chdir(working_dir)
      `unp #{working_dir}/*.zip 2>&1`
      `unp #{File.dirname(@result)}/*_out.zip 2>&1`
      Dir.chdir(current_directory)
    end

    def create_temp_table
      connection.run(%Q{
        CREATE TEMP TABLE tmp_x (
          recId int, 
          SeqNumber int, 
          seqLength int, 
          displayLatitude text, 
          displayLongitude text
        );}
      )
    end

    def import_results_to_temp_table
      connection.run(%Q{
        COPY tmp_x 
        FROM '#{Dir[File.join(working_dir, '*_out.txt')][0]}' 
        DELIMITER ',' CSV
      })
    end

    def load_results_into_original_table
      connection.run(%Q{
        UPDATE #{table_name} AS dest
        SET the_geom = ST_GeomFromText(
            'POINT(' || trim(orig.displayLatitude) || ' ' ||
              trim(orig.displayLongitude) || ')', 4326
            )
        FROM tmp_x AS orig WHERE dest.cartodb_id = orig.recId
      })
    end

  end # Geocoder
end # CartoDB
