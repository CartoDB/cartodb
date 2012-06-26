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
        allowed_cache_size = 1024
        random_table_prefix = "importing_#{Time.now.to_i}_#{@working_data[:suggested_name]}"
        if @working_data[:suggested_name].length > 10 #needs to be 8+2 less than normal names because of _polygon_n
          @working_data[:suggested_name] = @working_data[:suggested_name][0..9]
        end
        
        # I tried running the -G or --multi-geometry option to force multigeometries
        # but the result is always a column with mixed types, polygons and multipolgons!
        full_osm_command = "#{osm2pgsql_bin_path} #{host} #{port} -U #{@db_configuration[:username]} -d #{@db_configuration[:database]} -u -I -C #{allowed_cache_size} --multi-geometry --latlong -p #{random_table_prefix} #{@working_data[:path]}"
        
        log "Running osm2pgsql: #{full_osm_command}"
        @data_import.log_update(full_osm_command)
        
        stdin,  stdout, stderr = Open3.popen3(full_osm_command) 
  
        #unless (err = stderr.read).empty?
        if $?.exitstatus != 0  
        #if !(err = stderr.read).empty? or (sout = stdout.read).downcase.include? "failure"
          @data_import.set_error_code(6000)
          @data_import.log_update(stdout.read)
          @data_import.log_error(stderr.read)
          @data_import.log_error("ERROR: failed to import #{@working_data[:path]}")
          raise "ERROR: failed to import #{@working_data[:path]}"
        end
        
        unless (reg = stdout.read).empty?
          @runlog.stdout << reg
        end
        
        valid_tables = Array.new
        type_conversions = {"line" => "MULTILINESTRING", "polygon" => "MULTIPOLYGON", "roads" => "MULTILINESTRING", "points" => "POINT"}
        begin
          ["line", "polygon", "roads", "point"].each  do |feature| 
            old_table_name = "#{random_table_prefix}_#{feature}"
            rows_imported = @db_connection["SELECT count(*) as count from #{old_table_name}"].first[:count]
            unless rows_imported.nil? || rows_imported == 0
              valid_tables << feature
            else
              @db_connection.drop_table @old_table_name
            end
          end
        rescue
          @data_import.log_update(stdout.read)
          @data_import.log_update(stderr.read)
          @data_import.log_error("ERROR: failed to import #{@working_data[:path]}")
          raise "ERROR: failed to import #{@working_data[:path]}"
        end
        
        import_tag = "#{@working_data[:suggested_name]}_#{Time.now.to_i}"
        import_tables = Array.new
        payloads = Array.new
        valid_tables.each do |feature|
          @old_table_name = "#{random_table_prefix}_#{feature}"
          @table_name = get_valid_name("#{@working_data[:suggested_name]}_#{feature}")
          begin
            @db_connection.run("ALTER TABLE \"#{@old_table_name}\" RENAME TO \"#{@table_name}\"")
            @table_created = true
            #begin
              @entries.each{ |e| FileUtils.rm_rf(e) } if @entries.any?
        
              osm_geom_name = "way"
              geoms = @db_connection["SELECT count(*) as count from #{@table_name}"].first[:count]
              unless geoms.nil? || geoms == 0
                @db_connection.run("ALTER TABLE #{@table_name} RENAME COLUMN \"#{osm_geom_name}\" TO the_geom")
                # because the osm2pgsql importer isn't being complete about multi geom type
                # i use this check, instead of the full geom rebuild used in the table methods
                # to get all geoms to the same type
                if feature == "polygon"
                  @db_connection.run("UPDATE #{@table_name} SET the_geom = ST_Multi(the_geom) WHERE geometrytype(the_geom) != '#{type_conversions[feature]}' ;")
                end
              end
      
              begin
                # Sanitize column names where needed
                sanitize_table_columns @table_name
                column_names = @db_connection.schema(@table_name).map{ |s| s[0].to_s }
              rescue Exception => msg  
                @runlog.err << msg
                @data_import.log_update("ERROR: Failed to sanitize some column names")
              end
              
              @rows_imported = @db_connection["SELECT count(*) as count from #{@table_name}"].first[:count]
              
              # import_tables << @table_name
              # @last_table = @table_name
              @data_import.save
              
              @new_table = Table.new :tags => "#{import_tag}"
              # @di = DataImport.new(:user_id => @data_import.user_id)
              # @di.updated_at = Time.now
              # @di.save
              @new_table.user_id =  @data_import.user_id
              @new_table.data_import_id = @data_import.id
              @new_table.name = @table_name  
              @new_table.migrate_existing_table = @table_name 
              if @new_table.valid?
                @new_table.save
                
                payloads << OpenStruct.new({
                                        :name => @new_table.name, 
                                        :rows_imported => @rows_imported,
                                        :import_type => 'OSM',
                                        :log => ''
                                      })
              end
              @data_import.refresh
            
            # rescue
            #   @data_import.set_error_code(5000)
            #   @data_import.log_error("ERROR: unable to format table \"#{@table_name}\" for CartoDB")
            #   @db_connection.drop_table @old_table_name
            # end
          rescue Exception => msg  
            @runlog.err << msg
            @data_import.set_error_code(5000)
            @data_import.log_error(msg)
            @data_import.log_error("ERROR: unable to rename \"#{@old_table_name}\" to \"#{@table_name}\"")
            begin
              @db_connection.drop_table @old_table_name
            rescue
              @data_import.log_error("ERROR: \"#{@old_table_name}\" doesn't exist")
            end
          end  
        end
 
        
        # construct return variables
        payloads       
      end  
    end
  end    
end