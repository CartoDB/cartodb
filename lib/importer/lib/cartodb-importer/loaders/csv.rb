
module CartoDB
  module Import
    class CSV < CartoDB::Import::Loader

      register_loader :csv
      register_loader :txt

      def process!
        begin
          @data_import = DataImport.find(:id=>@data_import_id)

          # run Chardet + Iconv
          fix_encoding
        
          @data_import.log_update("ogr2ogr #{@working_data[:suggested_name]}")
          ogr2ogr_bin_path = `which ogr2ogr`.strip
          ogr2ogr_command = %Q{#{ogr2ogr_bin_path} -f "PostgreSQL" PG:"host=#{@db_configuration[:host]} port=#{@db_configuration[:port]} user=#{@db_configuration[:username]} dbname=#{@db_configuration[:database]}" #{@working_data[:path]} -nln #{@working_data[:suggested_name]}}
        
          stdin,  stdout, stderr = Open3.popen3(ogr2ogr_command) 
  
          unless (err = stderr.read).empty?
            if err.downcase.include?('failure')
              @data_import.set_error_code(3006)
              @data_import.log_error(err)
              @data_import.log_error("ERROR: failed to import #{@working_data[:ext].sub('.','')} to database")
              if err.include? "already exists"
                @data_import.set_error_code(5002)
                @data_import.log_error("ERROR: #{@working_data[:path]} contains reserved column names")
              end
              #raise "failed to import #{@working_data[:ext].sub('.','')} to database"
            else
              @data_import.log_update(err)
            end
          end
        
          unless (reg = stdout.read).empty?
            @runlog.stdout << reg
          end

          # Check if the file had data, if not rise an error because probably something went wrong
          begin
            rows_imported = @db_connection["SELECT * from #{@working_data[:suggested_name]} LIMIT 1"].first[:count]
          rescue Exception => e
            @runlog.err << "Empty table"
            @data_import.set_error_code(3006)
            @data_import.log_error(err)
            @data_import.log_error("ERROR: failed to import #{@working_data[:ext].sub('.','')} to database")
            raise "failed to import table"
          end
          if rows_imported == 0
            @runlog.err << "Empty table"
            @data_import.set_error_code(5001)
            @data_import.log_error(err)
            @data_import.log_error("ERROR: no data could be imported from file")
            raise "empty table"
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
          column_names = @db_connection.schema(@working_data[:suggested_name]).map{ |s| s[0].to_s }
          if column_names.include? "the_geom"
            @data_import.log_update("update the_geom")
            if res = @db_connection["select the_geom from #{@working_data[:suggested_name]} WHERE the_geom is not null and the_geom != '' limit 1"].first

              # attempt to read as geojson. If it fails, continue
              begin
                geojson       = RGeo::GeoJSON.decode(res[:the_geom], :json_parser => :json)
                geometry_type = geojson.geometry_type.type_name.upcase

                if geometry_type
                  # move original geometry column around
                  @db_connection.run("ALTER TABLE #{@working_data[:suggested_name]} RENAME COLUMN the_geom TO the_geom_orig;")
                  @db_connection.run("SELECT AddGeometryColumn('#{@working_data[:suggested_name]}','the_geom',4326, '#{geometry_type}', 2)")
                  @db_connection.run("CREATE INDEX #{@working_data[:suggested_name]}_the_geom_gist ON #{@working_data[:suggested_name]} USING GIST (the_geom)")

                  # loop through old geom parsing into the_geom.
                  # TODO: Replace with ST_GeomFromGeoJSON when production has been upgraded to postgis r8692
                  # @db_connection.run("UPDATE #{@working_data[:suggested_name]} SET the_geom = ST_SetSRID(ST_GeomFromGeoJSON(the_geom_orig),4326) WHERE the_geom_orig IS NOT NULL")
                  # tokumine ticket: http://trac.osgeo.org/postgis/ticket/1434
                  @data_import.log_update("converting GeoJSON to the_geom")
                  @db_connection["select the_geom_orig from #{@working_data[:suggested_name]} where the_geom_orig != '' and the_geom_orig is not null "].each do |res|
                    begin
                      geojson = RGeo::GeoJSON.decode(res[:the_geom_orig], :json_parser => :json)
                      if geojson
                        @db_connection.run("UPDATE #{@working_data[:suggested_name]} SET the_geom = ST_GeomFromText('#{geojson.as_text}', 4326) WHERE the_geom IS NULL AND the_geom_orig = '#{res[:the_geom_orig]}';");
                      end
                    rescue => e
                      @runlog.err << "silently fail conversion #{geojson.inspect} to #{@working_data[:suggested_name]}. #{e.inspect}"
                      @data_import.log_error("ERROR: silently fail conversion #{geojson.inspect} to #{@working_data[:suggested_name]}. #{e.inspect}")
                    end
                  end
                  # Drop original the_geom column
                  @db_connection.run("ALTER TABLE #{@working_data[:suggested_name]} DROP COLUMN the_geom_orig")
                end
              rescue => e
                column_names.delete('the_geom')
                @db_connection.run("ALTER TABLE #{@working_data[:suggested_name]} RENAME COLUMN the_geom TO invalid_the_geom;")
                @runlog.err << "failed to read geojson for #{@working_data[:suggested_name]}. #{e.inspect}"
                @data_import.log_error("ERROR: failed to read geojson for #{@working_data[:suggested_name]}. #{e.inspect}")
              end
            else
              begin
                column_names.delete('the_geom')
                @db_connection.run("ALTER TABLE #{@working_data[:suggested_name]} RENAME COLUMN the_geom TO invalid_the_geom;")
              rescue
                column_names.delete('the_geom')
                @runlog.err << "failed to convert the_geom to invalid_the_geom"
                @data_import.log_error("ERROR: failed to convert the_geom to invalid_the_geom")
              end
            end
          end
        
          # if there is no the_geom, and there are latitude and longitude columns, create the_geom
          unless column_names.include? "the_geom"

            latitude_possible_names = "'latitude','lat','latitudedecimal','latitud','lati','decimallatitude','decimallat'"
            longitude_possible_names = "'longitude','lon','lng','longitudedecimal','longitud','long','decimallongitude','decimallon'"

            matching_latitude = nil
            res = @db_connection["select column_name from information_schema.columns where table_name ='#{@working_data[:suggested_name]}'
              and lower(column_name) in (#{latitude_possible_names}) LIMIT 1"]
            if !res.first.nil?
              matching_latitude= res.first[:column_name]
            end
            matching_longitude = nil
            res = @db_connection["select column_name from information_schema.columns where table_name ='#{@working_data[:suggested_name]}'
              and lower(column_name) in (#{longitude_possible_names}) LIMIT 1"]
            if !res.first.nil?
              matching_longitude= res.first[:column_name]
            end
          
            if matching_latitude and matching_longitude
                @data_import.log_update("converting #{matching_latitude}, #{matching_longitude} to the_geom")
                #we know there is a latitude/longitude columns
                @db_connection.run("SELECT AddGeometryColumn('#{@working_data[:suggested_name]}','the_geom',4326, 'POINT', 2);")
                #TODO
                # reconcile the two matching_latitude regex below
                # the first one wasn't stringent enough, but i realize
                # the second one doesn't bother with absolute extent check
                @db_connection.run(<<-GEOREF
                UPDATE \"#{@working_data[:suggested_name]}\"
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
                add_index @working_data[:suggested_name], "importing_#{Time.now.to_i}_#{@working_data[:suggested_name]}"
            end
          end

          begin
            # Sanitize column names where needed
            sanitize_table_columns @working_data[:suggested_name]
          rescue Exception => msg  
            @runlog.err << msg
            @data_import.log_update("ERROR: Failed to sanitize some column names")
          end
        
        
          @table_created = true
          @data_import.log_update("table created")
          FileUtils.rm_rf(Dir.glob(@working_data[:path]))

          payload = OpenStruct.new({
                                  :name => @working_data[:suggested_name],
                                  :rows_imported => rows_imported,
                                  :import_type => @working_data[:ext],
                                  :log => @runlog
                                  })

          # construct return variables
          [payload]
        rescue => e
          @data_import.refresh #reload incase errors were written
          #@data_import.log_error(e)
          log "====================="
          log e
          log e.backtrace
          log "====================="
          begin  # TODO: Do we really mean nil here? What if a table is created?
            @db_connection.drop_table random_table_name
          rescue # silent try to drop the table            
          end
          begin  # TODO: Do we really mean nil here? What if a table is created?
            @db_connection.drop_table @working_data[:suggested_name]
          rescue # silent try to drop the table            
          end
        
          raise e
        end 
      end
    end
  end
end
