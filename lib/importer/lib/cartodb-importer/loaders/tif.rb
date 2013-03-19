module CartoDB
  class TIF
    def initialize(arguments)
      @data_import        = arguments.fetch(:data_import)
      @entries            = arguments.fetch(:entries)
      @db                 = arguments.fetch(:db)
      @db_configuration   = arguments.fetch(:db_configuration)
      @import_from_file   = arguments.fetch(:import_from_file)
      @python_bin_path    = `which python`.strip
      @psql_bin_path      = `which psql`.strip
      @working_data       = arguments.fetch(:working_data)
      @path               = @working_data.fetch(:path)
      @suggested_name     = @working_data.fetch(:suggested_name)
    end #initialize

    def process!
      data_import.log_update("Importing raster file: #{path}")
      raster2pgsql_bin_path = `which raster2pgsql`.strip
      host = db_configuration[:host] ? "-h #{db_configuration[:host]}" : ""
      port = db_configuration[:port] ? "-p #{db_configuration[:port]}" : ""

      random_table_name = "importing_#{Time.now.to_i}_#{suggested_name}"
      blocksize = "256x256"
      data_import.log_update("getting SRID with GDAL")
      gdal_command = "#{python_bin_path} -Wignore #{File.expand_path("../../../../misc/srid_from_gdal.py", __FILE__)} #{path}"
      rast_srid_command = `#{gdal_command}`.strip

      #@runlog.stdout << rast_srid_command if 0 < rast_srid_command.strip.length

      data_import.log_update("#{raster2pgsql_bin_path} -I -s #{rast_srid_command.strip} -t #{blocksize} #{path} #{random_table_name}")

      full_rast_command = "#{raster2pgsql_bin_path} -I -s #{rast_srid_command.strip} -t #{blocksize} #{path} #{random_table_name} | #{psql_bin_path} #{host} #{port} -U #{db_configuration[:username]} -w -d #{db_configuration[:database]}"

      out = `#{full_rast_command}`

      if 0 < out.strip.length
        data_import.set_error_code(4001)
        data_import.log_error(out)
        #@runlog.stdout << out
      end

      begin
        db.run("CREATE TABLE \"#{suggested_name}\" AS SELECT * FROM \"#{random_table_name}\"")
        db.run("DROP TABLE \"#{random_table_name}\"")
      rescue Exception => msg  
        data_import.set_error_code(5000)
        data_import.log_error(msg)
        #@runlog.err << msg
      end  

      entries.each{ |e| FileUtils.rm_rf(e) } if entries.any?
      rows_imported = db["SELECT count(*) as count from \"#{suggested_name}\""].first[:count]
      import_from_file.unlink
      #@table_created = true
      data_import.log_update("table created")

      [OpenStruct.new(
        name:           suggested_name, 
        rows_imported:  rows_imported,
        import_type:    '.tif',
        log:            '' #@runlog
      )]
    end  

    private

    attr_reader :data_import, :entries, :db, :db_configuration, :working_data,
                :import_from_file, :psql_bin_path, :python_bin_path, :path,
                :suggested_name
    
  end # TIF
end # CartoDB

