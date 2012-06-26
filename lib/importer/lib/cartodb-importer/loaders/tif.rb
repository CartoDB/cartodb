module CartoDB
  module Import
    class TIF < CartoDB::Import::Loader
      
      register_loader :tif
      register_loader :tiff

      def process!
        @data_import = DataImport.find(:id=>@data_import_id)

        log "Importing raster file: #{@working_data[:path]}"
        @data_import.log_update("Importing raster file: #{@working_data[:path]}")

        raster2pgsql_bin_path = `which raster2pgsql`.strip

        host = @db_configuration[:host] ? "-h #{@db_configuration[:host]}" : ""
        port = @db_configuration[:port] ? "-p #{@db_configuration[:port]}" : ""

        random_table_name = "importing_#{Time.now.to_i}_#{@working_data[:suggested_name]}"

        @data_import.log_update("getting SRID with GDAL")
        gdal_command = "#{@python_bin_path} -Wignore #{File.expand_path("../../../../misc/srid_from_gdal.py", __FILE__)} #{@working_data[:path]}"
        rast_srid_command = `#{gdal_command}`.strip

        if 0 < rast_srid_command.strip.length
          @runlog.stdout << rast_srid_command
        end

        puts "SRID : #{rast_srid_command}"
        
        blocksize = "256x256"
        @data_import.log_update("#{raster2pgsql_bin_path} -I -s #{rast_srid_command.strip} -t #{blocksize} #{@working_data[:path]} #{random_table_name}")
        full_rast_command = "#{raster2pgsql_bin_path} -I -s #{rast_srid_command.strip} -t #{blocksize} #{@working_data[:path]} #{random_table_name} | #{@psql_bin_path} #{host} #{port} -U #{@db_configuration[:username]} -w -d #{@db_configuration[:database]}"
        log "Running raster2pgsql: #{raster2pgsql_bin_path}  #{full_rast_command}"
        out = `#{full_rast_command}`
        if 0 < out.strip.length
          @data_import.set_error_code(4001)
          @data_import.log_error(out)
          @runlog.stdout << out
        end

        begin
          @db_connection.run("CREATE TABLE \"#{@working_data[:suggested_name]}\" AS SELECT * FROM \"#{random_table_name}\"")
          @db_connection.run("DROP TABLE \"#{random_table_name}\"")
        rescue Exception => msg  
          @data_import.set_error_code(5000)
          @data_import.log_error(msg)
          @runlog.err << msg
        end  

        @entries.each{ |e| FileUtils.rm_rf(e) } if @entries.any?
        rows_imported = @db_connection["SELECT count(*) as count from \"#{@working_data[:suggested_name]}\""].first[:count]
        @import_from_file.unlink
        @table_created = true
    
        @data_import.log_update("table created")
        payload = OpenStruct.new({
                                :name => @working_data[:suggested_name], 
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
