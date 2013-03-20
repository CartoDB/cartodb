# encoding: utf-8
require_relative '../exceptions'

module CartoDB
  class TIF
    BLOCKSIZE = "256x256"

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
      random_table_name     = "importing_#{Time.now.to_i}_#{suggested_name}"

      host = db_configuration[:host] ? "-h #{db_configuration[:host]}" : ""
      port = db_configuration[:port] ? "-p #{db_configuration[:port]}" : ""

      data_import.log_update("getting SRID with GDAL")
      gdal_command      = "#{python_bin_path} -Wignore #{File.expand_path("../../../../misc/srid_from_gdal.py", __FILE__)} #{path}"
      rast_srid_command = `#{gdal_command}`.strip.strip
      full_rast_command = "#{raster2pgsql_bin_path} -I -s #{rast_srid_command} -t #{BLOCKSIZE} #{path} #{random_table_name} | #{psql_bin_path} #{host} #{port} -U #{db_configuration[:username]} -w -d #{db_configuration[:database]}"

      #@runlog.stdout << rast_srid_command if 0 < rast_srid_command.strip.length
      data_import.log_update(full_rast_command)
      raster_output = `#{full_rast_command}`
      log_raster_error(raster_output) if raster_import_error?(raster_output)

      create_table(random_table_name)
      drop_temporary_table(random_table_name)
      #@table_created = true

      [OpenStruct.new(
        name:           suggested_name, 
        rows_imported:  rows_imported,
        import_type:    '.tif',
        log:            '' #@runlog
      )]
    rescue DatabaseImportError
      data_import.set_error_code(5000)
      data_import.log_error(msg)
      #@runlog.err << msg
    ensure
      entries.each { |entry| FileUtils.rm_rf(entry) }
      import_from_file.unlink
    end  

    private

    attr_reader :data_import, :entries, :db, :db_configuration, :working_data,
                :import_from_file, :psql_bin_path, :python_bin_path, :path,
                :suggested_name
    
    def log_raster_error(output)
      data_import.set_error_code(4001)
      data_import.log_error(output)
      #@runlog.stdout << out
    end #log_raster_error

    def create_table(table_name)
      db.run(%Q{
        CREATE TABLE "#{suggested_name}"
        AS SELECT * FROM "#{table_name}"
      })
      data_import.log_update("table created")
    rescue
      raise DatabaseImportError
    end #create_table

    def drop_temporary_table(table_name)
      db.run(%Q{DROP TABLE "#{table_name}"})
    rescue
      raise DatabaseImportError
    end #drop_temporary_table

    def rows_imported
      db[%Q{SELECT count(*) as count from "#{suggested_name}"}].first[:count]
    end #rows_imported

    def raster_import_error?(raster_output)
      0 < raster_output.strip.length
    end #raster_import_error?
  end # TIF
end # CartoDB

