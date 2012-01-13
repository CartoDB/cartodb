
module CartoDB
  module Import
    class CSV < CartoDB::Import::Loader

      register_loader :csv

      def process!

        # run Chardet + Iconv
        fix_encoding

        ogr2ogr_bin_path = `which ogr2ogr`.strip
        ogr2ogr_command = %Q{#{ogr2ogr_bin_path} -f "PostgreSQL" PG:"host=#{@db_configuration[:host]} port=#{@db_configuration[:port]} user=#{@db_configuration[:username]} dbname=#{@db_configuration[:database]}" #{@path} -nln #{@suggested_name}}

        out = `#{ogr2ogr_command}`

        if $?.exitstatus != 0
          raise "failed to convert import CSV into postgres using ogr2ogr: #{out.inspect}"
        end

        if 0 < out.strip.length
          @runlog.stdout << out
        end

        # Check if the file had data, if not rise an error because probably something went wrong
        if @db_connection["SELECT * from #{@suggested_name} LIMIT 1"].first.nil?
          @runlog.err << "Empty table"
          raise "Empty table"
        end

        # Sanitize column names where needed
        column_names = @db_connection.schema(@suggested_name).map{ |s| s[0].to_s }
        need_sanitizing = column_names.each do |column_name|
          if column_name != column_name.sanitize_column_name
            @db_connection.run("ALTER TABLE #{@suggested_name} RENAME COLUMN \"#{column_name}\" TO #{column_name.sanitize_column_name}")
          end
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
        if column_names.include? "the_geom"
          if res = @db_connection["select the_geom from #{@suggested_name} limit 1"].first

            # attempt to read as geojson. If it fails, continue
            begin
              geojson       = RGeo::GeoJSON.decode(res[:the_geom], :json_parser => :json)
              geometry_type = geojson.geometry_type.type_name.upcase

              if geometry_type
                # move original geometry column around
                @db_connection.run("ALTER TABLE #{@suggested_name} RENAME COLUMN the_geom TO the_geom_orig;")
                @db_connection.run("SELECT AddGeometryColumn('#{@suggested_name}','the_geom',4326, '#{geometry_type}', 2)")
                @db_connection.run("CREATE INDEX #{@suggested_name}_the_geom_gist ON #{@suggested_name} USING GIST (the_geom)")

                # loop through old geom parsing into the_geom.
                # TODO: Replace with ST_GeomFromGeoJSON when production has been upgraded to postgis r8692
                # @db_connection.run("UPDATE #{@suggested_name} SET the_geom = ST_SetSRID(ST_GeomFromGeoJSON(the_geom_orig),4326) WHERE the_geom_orig IS NOT NULL")
                # tokumine ticket: http://trac.osgeo.org/postgis/ticket/1434
                @db_connection["select the_geom_orig from #{@suggested_name}"].each do |res|
                  begin
                    geojson = RGeo::GeoJSON.decode(res[:the_geom_orig], :json_parser => :json)
                    @db_connection.run("UPDATE #{@suggested_name} SET the_geom = ST_GeomFromText('#{geojson.as_text}', 4326) WHERE the_geom_orig = '#{res[:the_geom_orig]}'")
                  rescue => e
                    @runlog.err << "silently fail conversion #{geojson.inspect} to #{@suggested_name}. #{e.inspect}"
                  end
                end

                # Drop original the_geom column
                @db_connection.run("ALTER TABLE #{@suggested_name} DROP COLUMN the_geom_orig")
              end
            rescue => e
              @runlog.err << "failed to read geojson for #{@suggested_name}. #{e.inspect}"
            end
          end
        end

        # if there is no the_geom, and there are latitude and longitude columns, create the_geom
        unless column_names.include? "the_geom"

          latitude_possible_names = "'latitude','lat','latitudedecimal','latitud','lati'"
          longitude_possible_names = "'longitude','lon','lng','longitudedecimal','longitud','long'"

          matching_latitude = nil
          res = @db_connection["select column_name from information_schema.columns where table_name ='#{@suggested_name}'
            and lower(column_name) in (#{latitude_possible_names}) LIMIT 1"]
          if !res.first.nil?
            matching_latitude= res.first[:column_name]
          end
          matching_longitude = nil
          res = @db_connection["select column_name from information_schema.columns where table_name ='#{@suggested_name}'
            and lower(column_name) in (#{longitude_possible_names}) LIMIT 1"]
          if !res.first.nil?
            matching_longitude= res.first[:column_name]
          end


          if matching_latitude and matching_longitude
              #we know there is a latitude/longitude columns
              @db_connection.run("SELECT AddGeometryColumn('#{@suggested_name}','the_geom',4326, 'POINT', 2);")

              @db_connection.run(<<-GEOREF
              UPDATE \"#{@suggested_name}\"
              SET the_geom =
                ST_GeomFromText(
                  'POINT(' || trim(\"#{matching_longitude}\") || ' ' || trim(\"#{matching_latitude}\") || ')', 4326
              )
              WHERE
              trim(CAST(\"#{matching_longitude}\" AS text)) ~ '^(([-+]?(([0-9]|[1-9][0-9]|1[0-7][0-9])(\.[0-9]+)?))|[-+]?180)$'
              AND
              trim(CAST(\"#{matching_latitude}\" AS text))  ~ '^(([-+]?(([0-9]|[1-8][0-9])(\.[0-9]+)?))|[-+]?90)$'
              GEOREF
              )
              @db_connection.run("CREATE INDEX \"#{@suggested_name}_the_geom_gist\" ON \"#{@suggested_name}\" USING GIST (the_geom)")
          end
        end

        @table_created = true
        FileUtils.rm_rf(Dir.glob(@path))
        rows_imported = @db_connection["SELECT count(*) as count from #{@suggested_name}"].first[:count]

        payload = OpenStruct.new({
                                :name => @suggested_name,
                                :rows_imported => rows_imported,
                                :import_type => @import_type,
                                :log => @runlog
                                })

        # construct return variables
        [to_import_hash, payload]
      end
    end
  end
end
