module CartoDB
  module Import
    class SHP < CartoDB::Import::Loader
      
      register_loader :shp

      def process!
        @data_import = DataImport.find(:id=>@data_import_id)

        log "processing shp"
        shp2pgsql_bin_path = `which shp2pgsql`.strip

        host = @db_configuration[:host] ? "-h #{@db_configuration[:host]}" : ""
        port = @db_configuration[:port] ? "-p #{@db_configuration[:port]}" : ""

        random_table_name = "importing_#{Time.now.to_i}_#{@suggested_name}"

        @data_import.log_update("running shp normalizer")
        normalizer_command = "#{@python_bin_path} -Wignore #{File.expand_path("../../../../misc/shp_normalizer.py", __FILE__)} \"#{@path}\" #{random_table_name}"
        out = `#{normalizer_command}`
        shp_args_command = out.split( /, */, 4 )
        
        if shp_args_command.length != 4
          @runlog.log << "Error running python shp_normalizer script: #{normalizer_command}"
          @runlog.stdout << out
          
          @data_import.set_error_code(3005)
          @data_import.log_error("#{normalizer_command}")
          @data_import.log_error(out)
          @data_import.log_error("ERROR: shp_normalizer script failed")
          raise "Error running python shp_normalizer script: #{normalizer_command}"
        end

        @data_import.log_update("#{shp2pgsql_bin_path} -s #{shp_args_command[0]} -D -i -g the_geom -W #{shp_args_command[1]} \"#{shp_args_command[2]}\" #{shp_args_command[3].strip}")
        full_shp_command = "#{shp2pgsql_bin_path} -s #{shp_args_command[0]} -D -i -g the_geom -W #{shp_args_command[1]} \"#{shp_args_command[2]}\" #{shp_args_command[3].strip} | #{@psql_bin_path} #{host} #{port} -U #{@db_configuration[:username]} -w -d #{@db_configuration[:database]}"
        
        log "Running shp2pgsql: #{full_shp_command}"
        
        stdin,  stdout, stderr = Open3.popen3(full_shp_command) 
  
        #unless (err = stderr.read).empty?
        # I think we may want to run a stdout.downcase.include?(error) here instead
        # will need to test, but shp2pgsql does not appear to throw an exitsta != 0 when an error occurs
        if $?.exitstatus != 0  
          @data_import.set_error_code(3005)
          @data_import.log_error(stderr)
          @data_import.log_error("ERROR: failed to generate SQL from #{@path}")
          raise "ERROR: failed to generate SQL from #{@path}"
        end
        
        unless (reg = stdout.read).empty?
          @runlog.stdout << reg
        end

        # TODO: THIS SHOULD BE UPDATE IF NOT NULL TO PREVENT CRASHING
        #debugger
        if shp_args_command[0] != '4326'
          @data_import.log_update("reprojecting the_geom column from #{shp_args_command[0]} to 4326")
          begin  
            @db_connection.run("ALTER TABLE #{random_table_name} RENAME COLUMN the_geom TO the_geom_orig;")
            geom_type = @db_connection["SELECT GeometryType(the_geom_orig) as type from #{random_table_name} WHERE the_geom_orig IS NOT NULL LIMIT 1"].first[:type]
            @db_connection.run("SELECT AddGeometryColumn('#{random_table_name}','the_geom',4326, '#{geom_type}', 2);")
            @db_connection.run("UPDATE \"#{random_table_name}\" SET the_geom = ST_Force_2D(ST_Transform(the_geom_orig, 4326)) WHERE the_geom_orig IS NOT NULL")
            @db_connection.run("ALTER TABLE #{random_table_name} DROP COLUMN the_geom_orig")
            @db_connection.run("CREATE INDEX \"#{random_table_name}_the_geom_gist\" ON \"#{random_table_name}\" USING GIST (the_geom)")
          rescue Exception => msg  
            @runlog.err << msg
            @data_import.set_error_code(2000)
            @data_import.log_error(msg)
            @data_import.log_error("ERROR: unable to convert EPSG:#{shp_args_command[0]} to EPSG:4326")
          end  
        end        
        
        # KML file imports are creating nasty 4 dim geoms sometimes, or worse, mixed dim
        # This block detects and then fixes those
        begin
          dimensions = @db_connection["SELECT max(st_ndims(the_geom)) as dim from \"#{random_table_name}\""].first[:dim]
          if 2 < dimensions
            @data_import.log_update("reprojecting the_geom column #{shp_args_command[0]} to 2D")              
            @db_connection.run("ALTER TABLE #{random_table_name} RENAME COLUMN the_geom TO the_geom_orig;")
            geom_type = @db_connection["SELECT GeometryType(the_geom_orig) as type from #{random_table_name} LIMIT 1"].first[:type]
            @db_connection.run("SELECT AddGeometryColumn('#{random_table_name}','the_geom',4326, '#{geom_type}', 2);")
            @db_connection.run("UPDATE \"#{random_table_name}\" SET the_geom = ST_Force_2D(ST_Transform(the_geom_orig, 4326))")
            @db_connection.run("ALTER TABLE #{random_table_name} DROP COLUMN the_geom_orig")
            @db_connection.run("CREATE INDEX \"#{random_table_name}_the_geom_gist\" ON \"#{random_table_name}\" USING GIST (the_geom)")
          end
        rescue Exception => msg  
          @runlog.err << msg
          @data_import.set_error_code(3102)
          @data_import.log_error(msg)
          @data_import.log_error("ERROR: Unable to force geoetry to 2-dimensions")
        end  
        
        begin
          @db_connection.run("ALTER TABLE \"#{random_table_name}\" RENAME TO \"#{@suggested_name}\"")
          @table_created = true
        rescue Exception => msg  
          @runlog.err << msg
          @data_import.set_error_code(5000)
          @data_import.log_error(msg)
          @data_import.log_error("ERROR: unable to rename \"#{random_table_name}\" to \"#{@suggested_name}\"")
        end  

        @entries.each{ |e| FileUtils.rm_rf(e) } if @entries.any?
        rows_imported = @db_connection["SELECT count(*) as count from \"#{@suggested_name}\""].first[:count]
        @import_from_file.unlink
        
        @data_import.save
        
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