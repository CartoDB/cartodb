module CartoDB
  module Import
    class OSM < CartoDB::Import::Loader
      
      register_loader :bz2
      register_loader :osm

      def process!
        @data_import = DataImport.find(:id=>@data_import_id)

        log "processing osm"
        osm2pgsql_bin_path = `which osm2pgsql`.strip

        host = @db_configuration[:host] ? "-H #{@db_configuration[:host]}" : ""
        port = @db_configuration[:port] ? "-P #{@db_configuration[:port]}" : ""
        
        # TODO
        # Create either a dynamic cache size based on user account type or pick a wiser number
        # for everybody
        allowed_cache_size = 24000
        random_table_prefix = "importing_#{Time.now.to_i}_#{@suggested_name}"
        
        full_osm_command = "#{osm2pgsql_bin_path} #{host} #{port} -U #{@db_configuration[:username]} -d #{@db_configuration[:database]} -u -G -I -C #{allowed_cache_size} -E 4326 -p #{random_table_prefix} #{@path}"
        
        log "Running osm2pgsql: #{full_osm_command}"
        @data_import.log_update(full_osm_command)
        
        stdin,  stdout, stderr = Open3.popen3(full_osm_command) 
  
        #unless (err = stderr.read).empty?
        if $?.exitstatus != 0  
          @data_import.set_error_code(3005)
          @data_import.log_error(stderr)
          @data_import.log_error("ERROR: failed to import #{@path}")
          raise "ERROR: failed to import #{@path}"
        end
        
        unless (reg = stdout.read).empty?
          @runlog.stdout << reg
        end
        
        valid_tables = Array.new
        
        ["line", "polygon", "roads", "point"].each  do |feature| 
          @old_table_name = "#{random_table_prefix}_#{feature}"
          rows_imported = @db_connection["SELECT count(*) as count from #{@old_table_name}"].first[:count]
          if !rows_imported.nil? and 0 < rows_imported
            valid_tables << feature
          else
            @db_connection.drop_table @old_table_name
          end
        end
        
        import_tables = Array.new
        valid_tables.each do |feature|
          @old_table_name = "#{random_table_prefix}_#{feature}"
          @table_name = get_valid_name("#{@suggested_name}_#{feature}")
          begin
            begin
              @db_connection.run("ALTER TABLE \"#{@old_table_name}\" RENAME TO \"#{@table_name}\"")
              @table_created = true
            rescue Exception => msg  
              @runlog.err << msg
              @data_import.set_error_code(5000)
              @data_import.log_error(msg)
              @data_import.log_error("ERROR: unable to rename \"#{@old_table_name}\" to \"#{@table_name}\"")
              @db_connection.drop_table @old_table_name
            end  
          
            @entries.each{ |e| FileUtils.rm_rf(e) } if @entries.any?
            @rows_imported = @db_connection["SELECT count(*) as count from #{@table_name}"].first[:count]
          
            osm_geom_name = "way"
            @db_connection.run("ALTER TABLE #{@table_name} RENAME COLUMN #{osm_geom_name} TO the_geom")
        
            # Sanitize column names where needed
            column_names = @db_connection.schema(@table_name).map{ |s| s[0].to_s }
            need_sanitizing = column_names.each do |column_name|
              if column_name != column_name.sanitize_column_name
                @db_connection.run("ALTER TABLE #{@table_name} RENAME COLUMN \"#{column_name}\" TO #{column_name.sanitize_column_name}")
              end
            end
            import_tables << @table_name
          rescue
              @db_connection.drop_table @old_table_name
          end
        end
        
        @import_from_file.unlink

        payload = OpenStruct.new({
                                :name => @table_name,
                                :rows_imported => @rows_imported,
                                :import_type => @import_type,
                                :import_tables => import_tables,
                                :log => @runlog
                              })
 
        # construct return variables
        [to_import_hash, payload]        
      end  
    end
  end    
end