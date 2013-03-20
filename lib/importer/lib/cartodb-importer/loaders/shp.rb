# encoding: utf-8
require 'open3'
require_relative '../utils/indexer'
require_relative '../utils/column_sanitizer'

module CartoDB
  class SHP
    def initialize(arguments={})
      @data_import        = arguments.fetch(:data_import)
      @db                 = arguments.fetch(:db)
      @db_configuration   = arguments.fetch(:db_configuration)
      @import_from_file   = arguments.fetch(:import_from_file)
      @python_bin_path    = `which python`.strip
      @psql_bin_path      = `which psql`.strip
      @working_data       = arguments.fetch(:working_data)
      @path               = @working_data.fetch(:path)
      @suggested_name     = @working_data.fetch(:suggested_name)
      @import_type        = @working_data.fetch(:import_type, nil)
      @extension          = @working_data.fetch(:ext)
    end #initialize

    def process!
      begin
        #check for available PRJ file
        unless File.exists?(path.gsub(".shp",".prj"))
          #runlog.log << "Error finding a PRJ file for uploaded SHP"
          data_import.set_error_code(3101)
          data_import.log_error("ERROR: CartoDB requires all SHP files to also contain a PRJ file")
          raise "Error finding a PRJ file for uploaded SHP"
        end

        shp2pgsql_bin_path = `which shp2pgsql`.strip
        host = db_configuration[:host] ? "-h #{db_configuration[:host]}" : ""
        port = db_configuration[:port] ? "-p #{db_configuration[:port]}" : ""


        random_table_name = "importing_#{Time.now.to_i}_#{suggested_name}"
        data_import.log_update("running shp normalizer")
        normalizer_command = "#{python_bin_path} -Wignore #{File.expand_path("../../../../misc/shp_normalizer.py", __FILE__)} \"#{path}\" #{random_table_name}"
        out = `#{normalizer_command}`

        shp_args_command = out.split( /, */, 4) 

        shp_args_command[1] = 'LATIN1' if shp_args_command[1] == "None"

        if shp_args_command[0] == 'None'
          data_import.set_error_code(3102)
          data_import.log_error("ERROR: we could not detect a known projection from your file")
          raise "ERROR: no known projection for #{path}"
        end

        if shp_args_command.length != 4
          #runlog.log << "Error running python shp_normalizer script: #{normalizer_command}"
          #runlog.stdout << out
          data_import.set_error_code(3005)
          data_import.log_error("#{normalizer_command}")
          data_import.log_error(out)
          data_import.log_error("ERROR: shp_normalizer script failed")
          raise "Error running python shp_normalizer script"
        end

        data_import.log_update("#{shp2pgsql_bin_path} -s #{shp_args_command[0]} -D -i -g the_geom -W #{shp_args_command[1]} \"#{shp_args_command[2]}\" #{shp_args_command[3].strip}")
        full_shp_command = "{ echo 'set statement_timeout=600000;'; #{shp2pgsql_bin_path} -s #{shp_args_command[0]} -D -i -g the_geom -W #{shp_args_command[1]} \"#{shp_args_command[2]}\" #{shp_args_command[3].strip}; } | #{psql_bin_path} #{host} #{port} -U #{db_configuration[:username]} -w -d #{db_configuration[:database]}"

        stdin,  stdout, stderr = Open3.popen3(full_shp_command)

        #unless (err = stderr.read).empty?
        # I think we may want to run a stdout.downcase.include?(error) here instead
        # will need to test, but shp2pgsql does not appear to throw an exitsta != 0 when an error occurs
        if $?.exitstatus != 0
          data_import.set_error_code(3005)
          data_import.log_error(stderr.read)
          data_import.log_error("ERROR: failed to generate SQL from #{working_data}")
          raise "ERROR: failed to generate SQL from #{working_data}"
        elsif (sderr = stderr.read) =~ /invalid SRID/
          data_import.set_error_code(3008)
          data_import.log_error(sderr)
          raise data_import.get_error_text[:what_about]
        elsif (sdout = stdout.read).downcase.include? "failure"
          data_import.set_error_code(3005)
          data_import.log_error(sdout)
          data_import.log_error("ERROR: failed to generate SQL from #{working_data}")
          raise "ERROR: failed to generate SQL from #{working_data}"
        end

        #runlog.stdout << reg unless (reg = stdout.read).empty?

        begin
          rows_imported = db["SELECT count(*) as count from \"#{random_table_name}\""].first[:count]
        rescue
          data_import.set_error_code(3005)
          data_import.log_error(stdout.read)
          data_import.log_error(stderr.read)
          data_import.log_error("ERROR: failed to generate SQL from #{working_data}")
          raise "ERROR: failed to generate SQL from #{working_data}"
        end

        if rows_imported == 0
          data_import.set_error_code(5001)
          data_import.log_error(stdout.read)
          data_import.log_error(stderr.read)
          data_import.log_error("ERROR: empty table from #{working_data}")
          raise "ERROR: empty table indicates an invalid or empty SHP file"
        end


        begin
          # Sanitize column names where needed
          CartoDB::ColumnSanitizer.new(db, random_table_name).run
          column_names = db.schema(random_table_name).map{ |s| s[0].to_s }
        rescue Exception => msg
          #runlog.err << msg
          data_import.log_update("ERROR: Failed to sanitize some column names")
        end

        unless column_names.include? 'the_geom'
          data_import.set_error_code(1006)
          data_import.log_update("ERROR: Not a valid or recognized SHP file")
          raise "ERROR: Not a valid or recognized SHP file"
        end

        # TODO: THIS SHOULD BE UPDATE IF NOT NULL TO PREVENT CRASHING
        # if shp_args_command[0] != '4326'
        # Forcing it to run the reproject EVERY time so that we can enforce the 2D issue
        data_import.log_update("reprojecting the_geom column from #{shp_args_command[0]} to 4326")
        begin
          reproject_import random_table_name
        rescue Exception => msg
          #runlog.err << msg
          data_import.set_error_code(2000)
          data_import.log_error(msg)
          data_import.log_error("ERROR: unable to convert EPSG:#{shp_args_command[0]} to EPSG:4326")
          raise "ERROR: unable to convert EPSG:#{shp_args_command[0]} to EPSG:4326"
        end
        # else
        #   # Even if the table is in the right projection, we need to ensure it is 2D
        #   begin
        #     force_table_2d random_table_name
        #   rescue Exception => msg
        #     #runlog.err << msg
        #     data_import.set_error_code(3110)
        #     data_import.log_error(msg)
        #     data_import.log_error("ERROR: unable to force EPSG:#{shp_args_command[0]} to 2D")
        #     raise "ERROR: unable to force EPSG:#{shp_args_command[0]} to 2D"
        #   end
        # end

        begin
          CartoDB::Indexer.new(db).add(random_table_name)
        rescue Exception => msg
          data_import.log_error(msg)
          data_import.log_error("ERROR: failed adding index")
        end

        begin
          db.run("ALTER TABLE \"#{random_table_name}\" RENAME TO \"#{suggested_name}\"")
          #@table_created = true
        rescue Exception => msg
          #runlog.err << msg
          data_import.set_error_code(5000)
          data_import.log_error(msg)
          data_import.log_error("ERROR: unable to rename \"#{random_table_name}\" to \"#{suggested_name}\"")
          raise "ERROR: unable to rename \"#{random_table_name}\" to \"#{suggested_name}\""
        end

        remove_shp_related_files
        import_from_file.unlink

        data_import.save
        [OpenStruct.new(
          name:           suggested_name,
          rows_imported:  rows_imported,
          import_type:    import_type || extension
        )]
      rescue => exception
        data_import.refresh #reload incase errors were written
        #data_import.log_error(e)

        begin  # TODO: Do we really mean nil here? What if a table is created?
          db.drop_table random_table_name
        rescue # silent try to drop the table
        end

        begin  # TODO: Do we really mean nil here? What if a table is created?
          db.drop_table suggested_name
        rescue # silent try to drop the table
        end

        raise exception
      end
    end #process!

    private

    attr_reader :data_import, :db, :db_configuration, :working_data,
                :import_from_file, :psql_bin_path, :python_bin_path,
                :path, :suggested_name, :import_type, :extension

    def remove_shp_related_files
      ['.sbn', '.sbx', '.fbn', '.fbx', '.ain', '.aih', '.ixs', '.mxs', 
      '.atx', '.cpg', '.shp.xml', '.shp', '.prj', '.dbf', '.shx'].each do |ext|
        Dir[path.gsub('.shp', ext)].each { |e| FileUtils.rm_rf(e) }
      end
    end #remove_shp_related_files

    def reproject_import(random_table_name)
      db.run(%Q{
       ALTER TABLE #{random_table_name}
       RENAME COLUMN the_geom
       TO the_geom_orig;
      })

      geom_type_row = db[%Q{
        SELECT GeometryType(ST_Force_2D(the_geom_orig)) 
        AS type
        FROM #{random_table_name}
        WHERE the_geom_orig IS NOT NULL
        LIMIT 1
      }].first

      if geom_type_row.nil?
        db.run(%Q{
          SELECT AddGeometryColumn('#{random_table_name}',
          'the_geom',4326, 'POINT', 2)
        })
      else
        geom_type = geom_type_row[:type]

        db.run(%Q{
          SELECT AddGeometryColumn('#{random_table_name}',
          'the_geom',4326, '#{geom_type}', 2)}
        )

        db.run(%Q{
          UPDATE "#{random_table_name}" 
          SET the_geom = ST_Force_2D(ST_Transform(the_geom_orig, 4326)) 
          WHERE the_geom_orig IS NOT NULL
        })
      end

      db.run(%Q{
        ALTER TABLE #{random_table_name} 
        DROP COLUMN the_geom_orig
      })
    end #reproject_import
  end # SHP
end # CartoDB

