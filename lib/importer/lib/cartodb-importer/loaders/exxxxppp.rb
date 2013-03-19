# encoding: utf-8
require_relative '../utils/column_sanitizer'

module CartoDB
  class Exxxxppp
    def initialize(arguments)
      @db               = arguments.fetch(:db)
      @db_configuration = arguments.fetch(:db_configuration)
      @working_data     = arguments.fetch(:working_data)
      @path             = @working_data.fetch(:path)
      @suggested_name   = @working_data.fetch(:suggested_name)
    end #initialize

    def process!
      ogr2ogr_bin_path = `which ogr2ogr`.strip
      ogr2ogr_command = %Q{#{ogr2ogr_bin_path} -f "PostgreSQL" PG:"host=#{db_configuration[:host]} port=#{db_configuration[:port]} user=#{db_configuration[:username]} dbname=#{db_configuration[:database]}" #{path} -nln #{suggested_name}}

      #@runlog.stdout << out if 0 < out.strip.length
      raise "failed to import data to postgres" if $?.exitstatus != 0

      unless file_has_data?
        #@runlog.err << "Empty table"
        raise "Empty table" 
      end

      CartoDB::ColumnSanitizer.new(db, suggested_name).run
      FileUtils.rm_rf(Dir.glob(path))

      [OpenStruct.new(
        name:           suggested_name,
        rows_imported:  rows_imported,
        import_type:    working_data.fetch(:import_type, nil)
      )]
    end #process!

    attr_reader :db, :db_configuration, :working_data, :path, :suggested_name

    def file_has_data?
      !( db["SELECT * from #{suggested_name} LIMIT 1"].first.nil? )
    end #file_has_data?

    def rows_imported
      db[%Q{
        SELECT count(*)
        AS count
        FROM #{suggested_name}}
      ].first[:count]
    end #rows_imported
  end # Exxxxppp
end # CartoDB

