# coding: UTF-8

module CartoDB
  class Exporter
    SUPPORTED_FORMATS = %W{ .csv .shp .kml }
    OUTPUT_FILE_LOCATION = "/tmp"
    class << self
      attr_accessor :debug
    end
    @@debug = true
    
    attr_accessor :table_name, :export_type,
                  :ext, :db_configuration, :db_connection
                  
    attr_reader :table_created, :force_name

    def initialize(options = {})
      log "options: #{options}"
      @@debug = options[:debug] if options[:debug]
      @table_name = options[:table_name]
      @export_type = options[:export_type]
      @file_name = "#{@table_name}_export"
      raise "table_name value can't be nil" if @table_name.nil?

      @db_configuration = options.slice(:database, :username, :password, :host, :port)
      @db_configuration[:port] ||= 5432
      @db_configuration[:host] ||= '127.0.0.1'
      @db_connection = Sequel.connect("postgres://#{@db_configuration[:username]}:#{@db_configuration[:password]}@#{@db_configuration[:host]}:#{@db_configuration[:port]}/#{@db_configuration[:database]}")
    rescue => e
      log $!
      log e.backtrace
      raise e
    end
    
    def export!
      csv_zipped = nil
      csv_file_path = Rails.root.join('tmp', "#{@file_name}.csv")
      zip_file_path  = Rails.root.join('tmp', "#{@file_name}.zip")
      FileUtils.rm_rf(Dir.glob(csv_file_path))
      FileUtils.rm_rf(Dir.glob(zip_file_path))      
         
      # Setup data export table
      user_database.run("DROP TABLE IF EXISTS #{@table_name}")
      export_schema = self.schema.map{|c| c.first} - [THE_GEOM]
      export_schema += ["ST_AsGeoJSON(the_geom, 6) as the_geom"] if self.schema.map{|c| c.first}.include?(THE_GEOM)
      user_database.run("CREATE TABLE #{@table_name} AS SELECT #{export_schema.join(',')} FROM #{self.name}")

      # Configure Postgres COPY command for dumping to CSV
      db_configuration = ::Rails::Sequel.configuration.environment_for(Rails.env)
      host     = db_configuration['host'] ? "-h #{db_configuration['host']}" : ""
      port     = db_configuration['port'] ? "-p #{db_configuration['port']}" : ""
      username = db_configuration['username']
      command  = "COPY (SELECT * FROM #{table_name}) TO STDOUT WITH DELIMITER ',' CSV QUOTE AS '\\\"' HEADER"
    
      # Execute CSV dump and log
      cmd = "#{`which psql`.strip} #{host} #{port} -U#{username} -w #{database_name} -c\"#{command}\" > #{csv_file_path}"      
      system cmd
      #CartoDB::Logger.info "Converted #{table_name} to CSV", cmd            
    
      # remove table whatever happened
      user_database.run("DROP TABLE #{table_name}")
    
      # Compress output
      # TODO: Move to ZLib, this is silly
      # http://jimneath.org/2010/01/04/cryptic-ruby-global-variables-and-their-meanings.html
      if $?.success?
        Zip::ZipFile.open(zip_file_path, Zip::ZipFile::CREATE) do |zipfile|
          zipfile.add(File.basename(csv_file_path), csv_file_path)
        end
        return File.read(zip_file_path)      
      else
        return nil
      end  
    
    ensure
      # Always cleanup files    
      FileUtils.rm_rf(Dir.glob(csv_file_path))
      FileUtils.rm_rf(Dir.glob(zip_file_path))      
    end
    rescue => e
      log "====================="
      log $!
      log e.backtrace
      log "====================="
      if !@table_created.nil?
        @db_connection.drop_table(@suggested_name)
      end
      raise e
    ensure
      @db_connection.disconnect
    end
    
    private
    
    def get_valid_name(name)
      candidates = @db_connection.tables.map{ |t| t.to_s }.select{ |t| t.match(/^#{name}/) }
      if candidates.any?
        max_candidate = candidates.max
        if max_candidate =~ /(.+)_(\d+)$/
          return $1 + "_#{$2.to_i +  1}"
        else
          return max_candidate + "_2"
        end
      else
        return name
      end
    end
    
    def log(str)
      if @@debug
        puts str
      end
    end
  end
end
