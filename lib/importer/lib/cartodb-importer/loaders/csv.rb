# encoding: utf-8
require 'iconv'
require_relative '../utils/column_sanitizer'

module CartoDB
  class CSV
    def initialize(arguments)
      @db                 = arguments.fetch(:db)
      @db_configuration   = arguments.fetch(:db_configuration)
      @data_import        = arguments.fetch(:data_import)
      @working_data       = arguments.fetch(:working_data)
      @path               = @working_data.fetch(:path)
      @suggested_name     = @working_data.fetch(:suggested_name)
      @extension          = @working_data.fetch(:ext)
      @iconv              = Iconv.new('UTF-8//IGNORE', 'UTF-8')
      @indexer            = CartoDB::Indexer.new(@db)
    end #initialize

    def process!
      # run Chardet + Iconv
      encoding_to_try = EncodingConverter.new(path).run
      data_import.log_update("ogr2ogr #{working_data[:suggested_name]}")

      ogr2ogr_bin_path = `which ogr2ogr`.strip
      ogr2ogr_command = %Q{PGCLIENTENCODING=#{encoding_to_try} #{ogr2ogr_bin_path} -lco FID=cartodb_id -f "PostgreSQL" PG:"host=#{db_configuration[:host]} port=#{db_configuration[:port]} user=#{db_configuration[:username]} dbname=#{db_configuration[:database]}" #{path} -nln #{suggested_name}}
      stdin,  stdout, stderr = Open3.popen3(ogr2ogr_command)

      unless (err = stderr.read).empty?
        err = iconv.iconv(err)
        if err.downcase.include?('failure')
          data_import.set_error_code(3006)
          data_import.log_error(err)
          data_import.log_error("ERROR: failed to import #{extension.sub('.','')} to database")
          if err.include? "already exists"
            data_import.set_error_code(5002)
            data_import.log_error("ERROR: #{path} contains reserved column names")
          end
          data_import.save
        else
          data_import.log_update(err)
        end
      end

      #@runlog.stdout << reg unless (reg = stdout.read).empty?

      # Check if the file had data, if not rise an error because probably something went wrong
      begin
        rows_imported = db["SELECT count(*) from #{suggested_name} LIMIT 1"].first[:count]
      rescue Exception => e
        #@runlog.err << "Empty table"
        data_import.set_error_code(3006)
        data_import.log_error(err)
        data_import.log_error("ERROR: failed to import #{extension.sub('.','')} to database")
        raise "failed to import table"
      end

      if rows_imported == 0
        #@runlog.err << "Empty table"
        data_import.set_error_code(5001)
        data_import.log_error(err)
        data_import.log_error("ERROR: no data could be imported from file")
        raise "empty table"
      end

      # Importing CartoDB GeoJSON
      # =========================
      # Result in a column called wkb_geometry
      # Start by renaming this column to the_geom
      # And then the next steps all follow the methods for CSV
      column_names = db.schema(suggested_name, :reload => true).map{ |s| s[0].to_s }
      if column_names.include? "wkb_geometry"
        db.run("ALTER TABLE #{suggested_name} RENAME COLUMN wkb_geometry TO the_geom;")
      end
      # Importing CartoDB CSV exports
      # ===============================
      # * if there is a column already called the_geom
      # * if there is geojson in it
      # * rename column to the_geom_orig
      # * create a new column with the correct type (Assume 4326) "the_geom_temp"
      # * loop over table and parse geojson into postgis geometries
      # * drop the_geom_orig
      #

      random_index_name = "importing_#{Time.now.to_i}_#{suggested_name}"
      column_names = db.schema(suggested_name, :reload => true).map{ |s| s[0].to_s }
      if column_names.include? "geojson"
        data_import.log_update("update the_geom")

        if res = db["select geojson from #{suggested_name} WHERE geojson is not null and geojson != '' limit 1"].first
          # attempt to read as geojson. If it fails, continue
          begin
            geojson       = RGeo::GeoJSON.decode(res[:geojson], :json_parser => :json)
            geometry_type = geojson.geometry_type.type_name.upcase

            if geometry_type
              # move original geometry column around
              db.run("SELECT AddGeometryColumn('#{suggested_name}', 'the_geom', 4326, 'geometry', 2)")

              data_import.log_update("converting GeoJSON to the_geom")

              sql_values = []
              db["select geojson, cartodb_id from #{suggested_name} where geojson != '' and geojson is not null "].each do |res|
                begin
                  geojson = RGeo::GeoJSON.decode(res[:geojson], :json_parser => :json)
                  
                  if geojson
                    sql_values << "(ST_SetSRID(ST_GeomFromText('#{geojson.as_text}'), 4326), #{res[:cartodb_id]})"
                  end
                rescue => e
                  #@runlog.err << "silently fail conversion #{geojson.inspect} to #{suggested_name}. #{e.inspect}"
                  data_import.log_error("ERROR: silently fail conversion #{geojson.inspect} to #{suggested_name}. #{e.inspect}")
                end
              end
              
              db.run(<<-GEOREF
                UPDATE #{suggested_name} o SET the_geom = n.the_geom
                  FROM ( VALUES
                  #{sql_values.join(',')}
                  ) AS n(the_geom, cartodb_id)
                  WHERE o.cartodb_id = n.cartodb_id;
              GEOREF
              )

              indexer.add(suggested_name, random_index_name)

              column_names << 'the_geom'
              column_names.delete('geojson')
              db.run("ALTER TABLE #{suggested_name} DROP COLUMN geojson;")
            end
          rescue => e
            column_names.delete('the_geom')
            indexer.drop(random_index_name)
            db.run("ALTER TABLE #{suggested_name} RENAME COLUMN the_geom TO invalid_the_geom;")
            #@runlog.err << "failed to read geojson for #{suggested_name}. #{e.inspect}"
            data_import.log_error("ERROR: failed to read geojson for #{suggested_name}. #{e.inspect}")
          end
        else
          begin
            column_names.delete('the_geom')
            indexer.drop(random_index_name)
            db.run("ALTER TABLE #{suggested_name} RENAME COLUMN the_geom TO invalid_the_geom;")
          rescue
            column_names.delete('the_geom')
            #@runlog.err << "failed to convert the_geom to invalid_the_geom"
            data_import.log_error("ERROR: failed to convert the_geom to invalid_the_geom")
          end
        end
      end

      # if there is no the_geom, and there are latitude and longitude columns, create the_geom
      unless column_names.include? "the_geom"

        latitude_possible_names = "'latitude','lat','latitudedecimal','latitud','lati','decimallatitude','decimallat'"
        longitude_possible_names = "'longitude','lon','lng','longitudedecimal','longitud','long','decimallongitude','decimallon'"

        matching_latitude = nil
        res = db["select column_name from information_schema.columns where table_name ='#{suggested_name}'
          and lower(column_name) in (#{latitude_possible_names}) LIMIT 1"]
        if !res.first.nil?
          matching_latitude= res.first[:column_name]
        end
        matching_longitude = nil
        res = db["select column_name from information_schema.columns where table_name ='#{suggested_name}'
          and lower(column_name) in (#{longitude_possible_names}) LIMIT 1"]
        if !res.first.nil?
          matching_longitude= res.first[:column_name]
        end

        if matching_latitude and matching_longitude
            data_import.log_update("converting #{matching_latitude}, #{matching_longitude} to the_geom")
            #we know there is a latitude/longitude columns
            db.run("SELECT AddGeometryColumn('#{suggested_name}','the_geom',4326, 'POINT', 2);")
            #TODO
            # reconcile the two matching_latitude regex below
            # the first one wasn't stringent enough, but i realize
            # the second one doesn't bother with absolute extent check
            db.run(<<-GEOREF
            UPDATE \"#{suggested_name}\"
            SET the_geom =
              ST_GeomFromText(
                'POINT(' || trim(\"#{matching_longitude}\") || ' ' || trim(\"#{matching_latitude}\") || ')', 4326
            )
            WHERE
            trim(CAST(\"#{matching_longitude}\" AS text)) ~ '^(([-+]?(([0-9]|[1-9][0-9]|1[0-7][0-9])(\.[0-9]+)?))|[-+]?180)$'
            AND
            trim(CAST(\"#{matching_latitude}\" AS text))  ~
            '^(([-+]?(([0-9]|[1-8][0-9])(\.[0-9]+)?))|[-+]?90)$'
            GEOREF
            )
            indexer.add(suggested_name, random_index_name)
        end
      end

      begin
        CartoDB::ColumnSanitizer.new(db, suggested_name).run
      rescue Exception => msg
        #@runlog.err << msg
        data_import.log_update("ERROR: Failed to sanitize some column names")
      end

      data_import.log_update("table created")
      FileUtils.rm_rf(Dir.glob(path))
      [OpenStruct.new(
        name:           suggested_name,
        rows_imported:  rows_imported,
        import_type:    working_data[:import_type] || extension
      )]

    rescue => exception
      data_import.refresh
      begin
        db.drop_table random_table_name
      rescue => exception
        db.drop_table suggested_name
        raise exception
      end
      raise exception
    end #process!

    private

    attr_reader :db, :db_configuration, :working_data, :data_import, :iconv,
                :path, :suggested_name, :extension, :indexer
  end # CSV
end # CartoDB

