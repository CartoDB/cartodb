module CartoDB
  module Import
    class TIF < CartoDB::Import::Loader
      
      register_loader :tif
      register_loader :tiff

      def process!

        log "Importing raster file: #{@path}"

        raster2pgsql_bin_path = `which raster2pgsql.py`.strip

        host = @db_configuration[:host] ? "-h #{@db_configuration[:host]}" : ""
        port = @db_configuration[:port] ? "-p #{@db_configuration[:port]}" : ""

        random_table_name = "importing_#{Time.now.to_i}_#{@suggested_name}"

        gdal_command = "#{@python_bin_path} -Wignore #{File.expand_path("../../../../misc/srid_from_gdal.py", __FILE__)} #{@path}"
        rast_srid_command = `#{gdal_command}`.strip

        if 0 < rast_srid_command.strip.length
          @runlog.stdout << rast_srid_command
        end

        puts "SRID : #{rast_srid_command}"
        
        blocksize = "20x20"
        full_rast_command = "#{raster2pgsql_bin_path} -I -s #{rast_srid_command.strip} -k #{blocksize} -t  #{random_table_name} -r #{@path} | #{@psql_bin_path} #{host} #{port} -U #{@db_configuration[:username]} -w -d #{@db_configuration[:database]}"
        log "Running raster2pgsql: #{raster2pgsql_bin_path}  #{full_rast_command}"
        out = `#{full_rast_command}`
        if 0 < out.strip.length
          @runlog.stdout << out
        end

        begin
          @db_connection.run("CREATE TABLE \"#{@suggested_name}\" AS SELECT * FROM \"#{random_table_name}\"")
          @db_connection.run("DROP TABLE \"#{random_table_name}\"")
        rescue Exception => msg  
          @runlog.err << msg
        end  

        @entries.each{ |e| FileUtils.rm_rf(e) } if @entries.any?
        rows_imported = @db_connection["SELECT count(*) as count from \"#{@suggested_name}\""].first[:count]
        @import_from_file.unlink
        @table_created = true
    
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
