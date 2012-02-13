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
    
    attr_accessor :table_name, :export_type, :name, :export_schema,
                  :ext, :db_configuration, :db_connection
                  
    attr_reader :table_created, :force_name

    def initialize(options = {})
      log "options: #{options}"
      @runlog           = OpenStruct.new :log => [], :stdout => [], :err => []   
      @@debug = options[:debug] if options[:debug]
      @table_name = options[:table_name]
      @export_type = options[:export_type]
      @name = options[:name]
      @export_schema = options[:export_schema]
      @file_name = "#{@table_name}_export"
      raise "table_name value can't be nil" if @table_name.nil?

      @psql_bin_path    = `which psql`.strip  
      
      @db_configuration = options.slice(:database, :username, :password, :host, :port)
      @db_configuration[:port] ||= 5432
      @db_configuration[:host] ||= '127.0.0.1'
      @db_connection = Sequel.connect("postgres://#{@db_configuration[:username]}:#{@db_configuration[:password]}@#{@db_configuration[:host]}:#{@db_configuration[:port]}/#{@db_configuration[:database]}")
    rescue => e
      log e.inspect
      raise e
    end
    
    def export!
      csv_zipped = nil
      csv_file_path = Rails.root.join(OUTPUT_FILE_LOCATION, "#{@file_name}.csv")
      zip_file_path  = Rails.root.join(OUTPUT_FILE_LOCATION, "#{@file_name}.zip")
      FileUtils.rm_rf(Dir.glob(csv_file_path))
      FileUtils.rm_rf(Dir.glob(zip_file_path))      
         
      # Setup data export table
      #@db_connection.run("DROP TABLE IF EXISTS #{@table_name}")
      #@db_connection.run("CREATE TABLE #{@table_name} AS SELECT #{@export_schema.join(',')} FROM #{@name}")
      # Configure Postgres COPY command for dumping to CSV
      #command  = "COPY (SELECT * FROM #{@table_name}) TO STDOUT WITH DELIMITER ',' CSV QUOTE AS '\\\"' HEADER"
      
      #cmd = "#{@psql_bin_path} #{@db_configuration[:host]} #{@db_configuration[:port]} -U#{@db_configuration[:username]} -w #{@db_configuration[:database]} -c\"#{command}\" > #{csv_file_path}"      
      #out = `cmd`
      
      ogr2ogr_bin_path = `which ogr2ogr`.strip
      ogr2ogr_command = %Q{#{ogr2ogr_bin_path} -f "CSV" #{csv_file_path} PG:"host=#{@db_configuration[:host]} port=#{@db_configuration[:port]} user=#{@db_configuration[:username]} dbname=#{@db_configuration[:database]}" -sql "SELECT #{@export_schema.join(',')} FROM #{@table_name}"}
      p ogr2ogr_command
      #CartoDB::Logger.info "Converted #{table_name} to CSV", cmd            
    
      # remove table whatever happened
      #@db_connection.run("DROP TABLE #{@table_name}")
    
      # Compress output
      # TODO: Move to ZLib, this is silly
      # http://jimneath.org/2010/01/04/cryptic-ruby-global-variables-and-their-meanings.html
      if $?.success?
        Zip::ZipFile.open(zip_file_path, Zip::ZipFile::CREATE) do |zipfile|
          zipfile.add(File.basename(csv_file_path), csv_file_path)
        end
        payload = OpenStruct.new({
                                :success => true,
                                :zip_file => File.read(zip_file_path),
                                :export_type => @export_type,
                                :log => @runlog
                                })    
      else
        payload = OpenStruct.new({
                                :success => @false,
                                :zip_file => nil,
                                :export_type => @export_type,
                                :log => @runlog
                                })

      end  
      return payload
    ensure
      # Always cleanup files    
      FileUtils.rm_rf(Dir.glob(csv_file_path))
      FileUtils.rm_rf(Dir.glob(zip_file_path))      
    end
  end
end