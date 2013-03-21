# encoding: utf-8
require 'iconv'
require_relative '../utils/column_sanitizer'

module CartoDB
  class CSV
    LATITUDE_POSSIBLE_NAMES   = "'latitude','lat','latitudedecimal','latitud','lati','decimallatitude','decimallat'"
    LONGITUDE_POSSIBLE_NAMES  = "'longitude','lon','lng','longitudedecimal','longitud','long','decimallongitude','decimallon'"
    ERRORS = {
      5001 => {
        description:  "ERROR: no data could be imported from file",
        exception:    "empty table"
      },
      5002 => {
        description:  "ERROR: data contains reserved column names",
        exception:    nil
      },
      3006 => {
        description: "ERROR: failed to import data to database",
        exception:    nil
      }
    }

    def initialize(arguments)
      @db                 = arguments.fetch(:db)
      @db_configuration   = arguments.fetch(:db_configuration)
      @data_import        = arguments.fetch(:data_import)
      working_data        = arguments.fetch(:working_data)
      @path               = working_data.fetch(:path)
      @suggested_name     = working_data.fetch(:suggested_name)
      @extension          = working_data.fetch(:ext)
      @import_type        = working_data.fetch(:import_type, @extension)
      @indexer            = CartoDB::Indexer.new(@db)
    end #initialize

    def process!
      data_import.log_update("ogr2ogr #{suggested_name}")
      import_csv_data
      error_helper(5001) if rows_imported == 0
      rename_to_the_geom if column_names.include? "wkb_geometry"
      column_names.include?("geojson") ?  read_as_geojson : create_the_geom

      unless CartoDB::ColumnSanitizer.new(db, suggested_name).run
        data_import.log_update("ERROR: Failed to sanitize some column names")
      end

      data_import.log_update("table created")

      FileUtils.rm_rf(Dir.glob(path))
      [OpenStruct.new(
        name:           suggested_name,
        rows_imported:  rows_imported,
        import_type:    import_type
      )]
    rescue => exception
      puts exception
      #data_import.refresh
      begin
        db.drop_table random_table_name
      rescue => exception
        db.drop_table suggested_name
        raise exception
      end
      raise exception
    end #process!

    private

    attr_reader :db, :db_configuration, :data_import, :iconv,
                :path, :suggested_name, :extension, :import_type, :indexer

    def random_index_name
      @random_index_name ||= "importing_#{Time.now.to_i}_#{suggested_name}"
    end #random_index_name

    def handle_ogr2ogr_errors(err)
      err = Iconv.new('UTF-8//IGNORE', 'UTF-8').iconv(err).downcase

      if err.include?('failure') && err.include?('already exists')
        error_helper(5002)
      elsif err.downcase.include?('failure')
        error_helper(3006)
      else
        data_import.log_update(err)
      end
      data_import.save
    end #handle_ogr2ogr_errors

    def rows_imported
      @rows_imported ||= db[%Q{
        SELECT count(*)
        FROM #{suggested_name}
        LIMIT 1
      }].first.fetch(:count)
    rescue Exception => e
      data_import.set_error_code(3006)
      data_import.log_error("ERROR: failed to import #{extension.sub('.','')} to database")
      raise "failed to import table"
    end #rows_imported

    def create_the_geom
      res       = get_latitude(suggested_name.dup)
      latitude  = res.first[:column_name] unless res.first.nil?
      res       = get_longitude(suggested_name.dup)
      longitude = res.first[:column_name] unless res.first.nil?
      return false unless latitude && longitude

      data_import.log_update("converting #{latitude}, #{longitude} to the_geom")
      add_geometry_column(suggested_name)
      georeference(latitude, longitude)
      indexer.add(suggested_name, random_index_name)
    end #create_the_geom
  
    def get_latitude(name)
      db[%Q{
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name ='#{name}'
        AND lower(column_name) in (#{LATITUDE_POSSIBLE_NAMES})
        LIMIT 1
      }]
    end #get_latitude

    def get_longitude(name)
      db[%Q{
        SELECT column_name 
        FROM information_schema.columns
        WHERE table_name ='#{name}'
        AND lower(column_name) in (#{LONGITUDE_POSSIBLE_NAMES})
        LIMIT 1
      }]
    end #get_longitude

    def add_geometry_column(name)
      db.run(%Q{
        SELECT AddGeometryColumn('#{name}', 'the_geom', 4326, 'POINT', 2)
      })
    end #add_geometry_column

    def georeference(latitude, longitude)
      #TODO
      # reconcile the two matching_latitude regex below
      # the first one wasn't stringent enough, but i realize
      # the second one doesn't bother with absolute extent check
      db.run(%Q{
        UPDATE "#{suggested_name}" 
        SET the_geom = ST_GeomFromText(
            'POINT(' || trim("#{longitude}") || ' ' ||
              trim("#{latitude}") || ')', 4326
        )
        WHERE trim(CAST("#{longitude}" AS text)) ~ 
          '^(([-+]?(([0-9]|[1-9][0-9]|1[0-7][0-9])(\.[0-9]+)?))|[-+]?180)$'
        AND trim(CAST("#{latitude}" AS text))  ~
          '^(([-+]?(([0-9]|[1-8][0-9])(\.[0-9]+)?))|[-+]?90)$'
      })
    end #georeference

    def invalidate_the_geom_column(name)
      db.run(%Q{
        ALTER TABLE #{name}
        RENAME COLUMN the_geom TO invalid_the_geom
      })
    rescue
      column_names.delete('the_geom')
      data_import.log_error("ERROR: failed to convert the_geom to invalid_the_geom")
    end #invalidate_the_geom_column

    def drop_geojson_column(name)
      db.run(%Q{ALTER TABLE #{name} DROP COLUMN geojson})
    end #drop_geojson_column

    def column_names
      db.schema(suggested_name, :reload => true).map{ |s| s[0].to_s }
    end #column_names

    def import_csv_data
      encoding          = EncodingConverter.new(path).run
      ogr2ogr_bin_path  = `which ogr2ogr`.strip
      ogr2ogr_command   = 
        %Q{PGCLIENTENCODING=#{encoding} #{ogr2ogr_bin_path} } +
        %Q{-lco FID=cartodb_id -f "PostgreSQL" } +  
        %Q{PG:"host=#{db_configuration[:host]} } +
        %Q{port=#{db_configuration[:port]} } +
        %Q{user=#{db_configuration[:username]} } +
        %Q{dbname=#{db_configuration[:database]}" } +
        %Q{#{path} -nln #{suggested_name}}

      stdin,  stdout, stderr = Open3.popen3(ogr2ogr_command)
      err = stderr.read
      handle_ogr2ogr_errors(err) unless err.empty?
    end #import_csv_data

    def error_helper(error_code)
      exception_message = ERRORS.fetch(error_code).fetch(:exception, nil)
      data_import.set_error_code(error_code)
      data_import.log_error(ERRORS.fetch(error_code).fetch(:description))
      raise exception_message if exception_message
    end #error_helper

    def rename_to_the_geom
      db.run(%Q{
        ALTER TABLE #{suggested_name} 
        RENAME COLUMN wkb_geometry TO the_geom
      })
    end #rename_to_the_geom

    def read_as_geojson
      data_import.log_update("update the_geom")
      geojson       = RGeo::GeoJSON.decode(geojson_data[:geojson], json_parser: :json)
      geometry_type = geojson.geometry_type.type_name.upcase

      if geometry_type
        # move original geometry column around
        db.run("SELECT AddGeometryColumn('#{suggested_name}', 'the_geom', 4326, 'geometry', 2)")

        data_import.log_update("converting GeoJSON to the_geom")

        update_the_geom_with(convert)
        indexer.add(suggested_name, random_index_name)
        column_names << 'the_geom'
        column_names.delete('geojson')
        drop_geojson_column(suggested_name)
      end
    rescue => exception
      puts exception
      column_names.delete('the_geom')
      indexer.drop(random_index_name)
      invalidate_the_geom_column(suggested_name)
      data_import.log_error("ERROR: failed to read geojson for #{suggested_name}. #{exception.inspect}")
    end #read_as_geojson

    def update_the_geom_with(values)
      db.run(%Q{
        UPDATE #{suggested_name} o SET the_geom = n.the_geom
        FROM (VALUES #{values.join(',')})
        AS n(the_geom, cartodb_id)
        WHERE o.cartodb_id = n.cartodb_id
      })
    end #update_the_geom_with

    def geojson_data
      db[%Q{
        SELECT geojson 
        FROM #{suggested_name}
        WHERE geojson is not null
        AND geojson != ''
        LIMIT 1
      }].first
    end #geojson_data
    
    def get_current_geojson_data
      db[%Q{
        SELECT geojson, cartodb_id
        FROM #{suggested_name}
        WHERE geojson != ''
        AND geojson is not null
      }]
    end #get_current_geojson_data

    def convert
      get_current_geojson_data.inject(Array.new) do |values, row|
        geojson = RGeo::GeoJSON.decode(row.fetch(:geojson), :json_parser => :json)
        values << "(ST_SetSRID(ST_GeomFromText('#{geojson.as_text}'), 4326), #{row[:cartodb_id]})" if geojson
      end
    rescue => exception
      data_import.log_error("ERROR: silently fail conversion #{geojson.inspect} to #{suggested_name}. #{exception.inspect}")
    end #convert
  end # CSV
end # CartoDB

