# coding: UTF-8

module CartoDB
  class Exporter
    class << self
      attr_accessor :debug
    end
    include CartoDB::Import::Util
    
    SUPPORTED_FORMATS = %W{ .csv .shp .kml }
    OUTPUT_FILE_LOCATION = "/tmp"
    
    @@debug = true
    
    attr_accessor :table_name, :export_type, :file_name, :export_schema,
                  :ext, :db_configuration, :db_connection
                  
    attr_reader :table_created, :force_name

    def initialize(options = {})
      raise "table_name value can't be nil" if options[:table_name].nil?

      log "options: #{options}"
      @runlog           = OpenStruct.new :log => [], :stdout => [], :err => []   
      @@debug           = options[:debug] if options[:debug]
      @table_name       = options[:table_name]
      @export_type      = options[:export_type]
      @export_schema    = options[:export_schema]
      
      @export_dir     = "cartodb_export_#{Time.now.to_i}_#{rand(10000)}"
      @file_name      = "#{@table_name}_export"      
      @all_files_dir  = build_path(OUTPUT_FILE_LOCATION, @export_dir)
      @all_files_path = build_path(@all_files_dir, "#{@file_name}.*")

      @psql_bin_path             = `which psql`.strip        
      @db_configuration          = options.slice(:database, :username, :password, :host, :port)
      @db_configuration[:port] ||= 5432
      @db_configuration[:host] ||= '127.0.0.1'
      @db_connection = Sequel.connect("postgres://#{@db_configuration[:username]}:#{@db_configuration[:password]}@#{@db_configuration[:host]}:#{@db_configuration[:port]}/#{@db_configuration[:database]}")
    rescue => e
      log e.inspect
      raise e
    end
    
    def build_path *args
      Pathname.new(File.join(args))
    end
    
    def export!
      # prep final location
      FileUtils.rm_rf(@all_files_dir)
      FileUtils.mkdir_p(@all_files_dir)

      # TODO turn this into a factory setup like importer
      if @export_type == 'sql'
        sql_file_path  = build_path(@all_files_dir, "#{@file_name}.sql")
        zip_file_path  = build_path(@all_files_dir, "#{@file_name}.zip")
        #ogr2ogr_bin_path = `which ogr2ogr`.strip
        #ogr2ogr_command = "#{ogr2ogr_bin_path} -f \"PGDump\" #{sql_file_path} PG:\"host=#{@db_configuration[:host]} port=#{@db_configuration[:port]} user=#{@db_configuration[:username]} dbname=#{@db_configuration[:database]}\" -sql \"SELECT #{@export_schema.join(',')} FROM #{@table_name}\""
        #out = `#{ogr2ogr_command}`
        
        pg_dump_bin_path = `which pg_dump`.strip
        pg_dump_command = "#{pg_dump_bin_path} --data-only --table #{@table_name} -U #{@db_configuration[:username]} #{@db_configuration[:database]} -f #{sql_file_path}"
        out = `#{pg_dump_command}`
        
        if $?.success?
          Zip::ZipFile.open(zip_file_path, Zip::ZipFile::CREATE) do |zipfile|
            zipfile.add(File.basename(sql_file_path), sql_file_path)
          end
          return File.read(zip_file_path)
          # return OpenStruct.new({
          #                         :success => true,
          #                         :zip_file => File.read(kmz_file_path),
          #                         :export_type => @export_type,
          #                         :log => @runlog
          #                         })    
        end
      elsif @export_type == 'kml'
        kml_file_path  = build_path(@all_files_dir, "#{@file_name}.kml")
        kmz_file_path  = build_path(@all_files_dir, "#{@file_name}.kmz")
      
        ogr2ogr_bin_path = `which ogr2ogr`.strip
        ogr2ogr_command = "#{ogr2ogr_bin_path} -f \"KML\" #{kml_file_path} PG:\"host=#{@db_configuration[:host]} port=#{@db_configuration[:port]} user=#{@db_configuration[:username]} dbname=#{@db_configuration[:database]}\" -sql \"SELECT #{@export_schema.join(',')} FROM #{@table_name}\""
        out = `#{ogr2ogr_command}`
        
        if $?.success?
          Zip::ZipFile.open(kmz_file_path, Zip::ZipFile::CREATE) do |zipfile|
            zipfile.add(File.basename(kml_file_path), kml_file_path)
          end
          return File.read(kmz_file_path)
          # return OpenStruct.new({
          #                         :success => true,
          #                         :zip_file => File.read(kmz_file_path),
          #                         :export_type => @export_type,
          #                         :log => @runlog
          #                         })    
        end
      elsif @export_type == 'shp'
        shp_file_path = build_path(@all_files_dir, "#{@file_name}.shp")
        zip_file_path = build_path(@all_files_dir, "#{@file_name}.zip")
      
        ogr2ogr_bin_path = `which ogr2ogr`.strip
        ogr2ogr_command = "#{ogr2ogr_bin_path} -f \"ESRI Shapefile\" #{shp_file_path} PG:\"host=#{@db_configuration[:host]} port=#{@db_configuration[:port]} user=#{@db_configuration[:username]} dbname=#{@db_configuration[:database]}\" -sql \"SELECT #{@export_schema.join(',')} FROM #{@table_name}\""
        out = `#{ogr2ogr_command}`
        
        if $?.success?
          Zip::ZipFile.open(zip_file_path, Zip::ZipFile::CREATE) do |zipfile|
            Dir.glob(@all_files_path).each do |f|
              zipfile.add(File.basename(f), f)
            end
          end
          return File.read(zip_file_path)
          # return OpenStruct.new({
          #                         :success => true,
          #                         :zip_file => File.read(zip_file_path),
          #                         :export_type => @export_type,
          #                         :log => @runlog
          #                         })    
        end
      elsif @export_type == 'csv'
        csv_zipped = nil
        csv_file_path = build_path(@all_files_dir, "#{@file_name}.csv")
        zip_file_path = build_path(@all_files_dir, "#{@file_name}.zip")
         
        # Setup data export table
        #@db_connection.run("DROP TABLE IF EXISTS #{@table_name}")
        #@db_connection.run("CREATE TABLE #{@table_name} AS SELECT #{@export_schema.join(',')} FROM #{@name}")
        # Configure Postgres COPY command for dumping to CSV
        #command  = "COPY (SELECT  FROM #{@table_name}) TO STDOUT WITH DELIMITER ',' CSV QUOTE AS '\\\"' HEADER"
      
        #cmd = "#{@psql_bin_path} #{@db_configuration[:host]} #{@db_configuration[:port]} -U#{@db_configuration[:username]} -w #{@db_configuration[:database]} -c\"#{command}\" > #{csv_file_path}"      
        #out = `cmd`
      
        #CartoDB::Logger.info "Converted #{table_name} to CSV", cmd            
    
        # remove table whatever happened
        #@db_connection.run("DROP TABLE #{@table_name}")
    
        # an improved version of what was done before, with table copy read drop
        # Configure Postgres COPY command for dumping to CSV
        #command  = "COPY (SELECT #{@export_schema.join(',')} FROM #{@table_name}) TO STDOUT WITH DELIMITER ',' CSV QUOTE AS '\\\"' HEADER"
        #cmd = %Q{#{@psql_bin_path} -h#{@db_configuration[:host]} -p#{@db_configuration[:port]} -U#{@db_configuration[:username]} -w #{@db_configuration[:database]} -c\"#{command}\" > #{csv_file_path}}

        ogr2ogr_bin_path = `which ogr2ogr`.strip
        ogr2ogr_command = "#{ogr2ogr_bin_path} -f \"CSV\" #{csv_file_path} PG:\"host=#{@db_configuration[:host]} port=#{@db_configuration[:port]} user=#{@db_configuration[:username]} dbname=#{@db_configuration[:database]}\" -sql \"SELECT #{@export_schema.join(',')} FROM #{@table_name}\""
        out = `#{ogr2ogr_command}`
      Rails.logger.info ogr2ogr_command
      
        # the way we should do it, but fix for quoting like above
        #ogr2ogr_bin_path = `which ogr2ogr`.strip
        #ogr2ogr_command = %Q{#{ogr2ogr_bin_path} -f "CSV" #{csv_file_path} PG:"host=#{@db_configuration[:host]} port=#{@db_configuration[:port]} user=#{@db_configuration[:username]} dbname=#{@db_configuration[:database]}" -sql "SELECT #{@export_schema.join(',').replace("ST_AsGeoJSON(the_geom, 6) as the_geom","the_geom")} FROM #{@table_name}" -lco "GEOMETRY=AS_WKT"}
      
        # Compress output
        # TODO: Move to ZLib, this is silly
        # http://jimneath.org/2010/01/04/cryptic-ruby-global-variables-and-their-meanings.html
        if $?.success?
          Zip::ZipFile.open(zip_file_path, Zip::ZipFile::CREATE) do |zipfile|
            zipfile.add(File.basename(csv_file_path), csv_file_path)
          end
          return File.read(zip_file_path)
          # return OpenStruct.new({
          #                         :success => true,
          #                         :zip_file => File.read(zip_file_path),
          #                         :export_type => @export_type,
          #                         :log => @runlog
          #                         })    
        end  
      end
    ensure
      # Always cleanup files    
      FileUtils.rm_rf(@all_files_dir) 
    end
  end
end