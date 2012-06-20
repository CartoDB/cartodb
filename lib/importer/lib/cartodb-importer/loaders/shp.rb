module CartoDB
  module Import
    class SHP < CartoDB::Import::Loader
      
      register_loader :shp

      def process!
        @data_import = DataImport.find(:id=>@data_import_id)

        log "processing shp"
        
        #check for available PRJ file
        unless File.exists?(@path.gsub(".shp",".prj"))
          @runlog.log << "Error finding a PRJ file for uploaded SHP"
          @data_import.set_error_code(3101)
          @data_import.log_error("ERROR: CartoDB requires all SHP files to also contain a PRJ file")
          raise "Error finding a PRJ file for uploaded SHP"
        end
        
        shp2pgsql_bin_path = `which shp2pgsql`.strip
        
        host = @db_configuration[:host] ? "-h #{@db_configuration[:host]}" : ""
        port = @db_configuration[:port] ? "-p #{@db_configuration[:port]}" : ""

        random_table_name = "importing_#{Time.now.to_i}_#{@suggested_name}"

        @data_import.log_update("running shp normalizer")
        normalizer_command = "#{@python_bin_path} -Wignore #{File.expand_path("../../../../misc/shp_normalizer.py", __FILE__)} \"#{@path}\" #{random_table_name}"
        out = `#{normalizer_command}`
        
        shp_args_command = out.split( /, */, 4 )
        if shp_args_command[1]=="None"
          shp_args_command[1]='LATIN1'
        end
        if shp_args_command[0] == 'None'
          @data_import.set_error_code(3102)
          @data_import.log_error("ERROR: we could not detect a known projection from your file")
          raise "ERROR: no known projection for #{@path}"
        end
        
        if shp_args_command.length != 4
          @runlog.log << "Error running python shp_normalizer script: #{normalizer_command}"
          @runlog.stdout << out
          @data_import.set_error_code(3005)
          @data_import.log_error("#{normalizer_command}")
          @data_import.log_error(out)
          @data_import.log_error("ERROR: shp_normalizer script failed")
          raise "Error running python shp_normalizer script"
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
          @data_import.log_error(stderr.read)
          @data_import.log_error("ERROR: failed to generate SQL from #{@path}")
          raise "ERROR: failed to generate SQL from #{@path}"
        elsif (sdout = stdout.read).downcase.include? "failure"
          @data_import.set_error_code(3005)
          @data_import.log_error(sdout)
          @data_import.log_error("ERROR: failed to generate SQL from #{@path}")
          raise "ERROR: failed to generate SQL from #{@path}"
        end
        
        unless (reg = stdout.read).empty?
          @runlog.stdout << reg
        end
        
        begin
          rows_imported = @db_connection["SELECT count(*) as count from \"#{random_table_name}\""].first[:count]
        rescue
          @data_import.set_error_code(3005)
          @data_import.log_error(stdout.read)
          @data_import.log_error(stderr.read)
          @data_import.log_error("ERROR: failed to generate SQL from #{@path}")
          raise "ERROR: failed to generate SQL from #{@path}"
        end
        
        begin
          # Sanitize column names where needed
          sanitize_table_columns random_table_name
          column_names = @db_connection.schema(random_table_name).map{ |s| s[0].to_s }
        rescue Exception => msg  
          @runlog.err << msg
          @data_import.log_update("ERROR: Failed to sanitize some column names")
        end
        
        unless column_names.include? 'the_geom'
          @data_import.set_error_code(1006)
          @data_import.log_update("ERROR: Not a valid or recognized SHP file")
          raise "ERROR: Not a valid or recognized SHP file"
        end
        
        # TODO: THIS SHOULD BE UPDATE IF NOT NULL TO PREVENT CRASHING
        # if shp_args_command[0] != '4326'
        # Forcing it to run the reproject EVERY time so that we can enforce the 2D issue
        @data_import.log_update("reprojecting the_geom column from #{shp_args_command[0]} to 4326")
        begin  
          reproject_import random_table_name
        rescue Exception => msg  
          @runlog.err << msg
          @data_import.set_error_code(2000)
          @data_import.log_error(msg)
          @data_import.log_error("ERROR: unable to convert EPSG:#{shp_args_command[0]} to EPSG:4326")
          raise "ERROR: unable to convert EPSG:#{shp_args_command[0]} to EPSG:4326"
        end  
        # else  
        #   # Even if the table is in the right projection, we need to ensure it is 2D
        #   begin  
        #     force_table_2d random_table_name
        #   rescue Exception => msg  
        #     @runlog.err << msg
        #     @data_import.set_error_code(3110)
        #     @data_import.log_error(msg)
        #     @data_import.log_error("ERROR: unable to force EPSG:#{shp_args_command[0]} to 2D")
        #     raise "ERROR: unable to force EPSG:#{shp_args_command[0]} to 2D"
        #   end
        # end
        
        begin  
          add_index random_table_name
        rescue Exception => msg  
          @data_import.log_error(msg)
          @data_import.log_error("ERROR: failed adding index")
        end  
        
        begin
          @db_connection.run("ALTER TABLE \"#{random_table_name}\" RENAME TO \"#{@suggested_name}\"")
          @table_created = true
        rescue Exception => msg  
          @runlog.err << msg
          @data_import.set_error_code(5000)
          @data_import.log_error(msg)
          @data_import.log_error("ERROR: unable to rename \"#{random_table_name}\" to \"#{@suggested_name}\"")
          raise "ERROR: unable to rename \"#{random_table_name}\" to \"#{@suggested_name}\""
        end  

        @entries.each{ |e| FileUtils.rm_rf(e) } if @entries.any?
        @import_from_file.unlink
        
        @data_import.save
        
        payload = OpenStruct.new({
                                :name => @suggested_name, 
                                :rows_imported => rows_imported,
                                :import_type => @import_type,
                                :log => @runlog
                              })
 
        # construct return variables
        # [to_import_hash, payload] 
        payload       
      end  
    end
  end    
end