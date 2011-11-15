# coding: UTF-8

module CartoDB
  class Exporter
    SUPPORTED_FORMATS = %W{ .csv .shp .kml }
    OUTPUT_FILE_LOCATION = "/tmp"
    class << self
      attr_accessor :debug
    end
    @@debug = true
    
    attr_accessor :export_to_file, :type, :suggested_name,
                  :ext, :db_configuration, :db_connection
                  
    attr_reader :table_created, :force_name

    def initialize(options = {})
      log "options: #{options}"
      @@debug = options[:debug] if options[:debug]
      @table_created = nil
      @export_to_file = options[:export_to_file]
      @type = options[:type]
      raise "export_to_file value can't be nil" if @export_to_file.nil?

      @db_configuration = options.slice(:database, :username, :password, :host, :port)
      @db_configuration[:port] ||= 5432
      @db_configuration[:host] ||= '127.0.0.1'
      @db_connection = Sequel.connect("postgres://#{@db_configuration[:username]}:#{@db_configuration[:password]}@#{@db_configuration[:host]}:#{@db_configuration[:port]}/#{@db_configuration[:database]}")

      unless options[:suggested_name].nil? || options[:suggested_name].blank?
        @force_name = true
        @suggested_name = get_valid_name(options[:suggested_name])
      else
        @force_name = false
      end
      
    rescue => e
      log $!
      log e.backtrace
      raise e
    end
    
    def export!
      path = "#{OUTPUT_FILE_LOCATION}/exporting_#{Time.now.to_i}_#{@export_to_file}"
      
      python_bin_path = `which python`.strip
      psql_bin_path = `which psql`.strip
      
      entries = []
      
      export_type = ".#{@type}"

      if @type == 'csv'
        
        ogr2ogr_bin_path = `which ogr2ogr`.strip
        ogr2ogr_command = %Q{#{ogr2ogr_bin_path} -f "CSV" #{path} PG:"host=#{@db_configuration[:host]} port=#{@db_configuration[:port]} user=#{@db_configuration[:username]} dbname=#{@db_configuration[:database]}" #{@export_to_file}}

        output = `#{ogr2ogr_command} &> /dev/null`
        
        Zip::ZipOutputStream.open("#{path}.zip") do |zia|
          zia.put_next_entry("#{@export_to_file}.#{type}")
          zia.print IO.read("#{path}/#{@export_to_file}.#{type}")
        end
        FileUtils.rm_rf(path)
        
        log "path: #{path}"
        return OpenStruct.new({
          :name => @export_to_file, 
          :import_type => export_type,
          :path => "#{path}.#{type}"
          })
        
      end
      if @type == 'kml'

        ogr2ogr_bin_path = `which ogr2ogr`.strip
        ogr2ogr_command = %Q{#{ogr2ogr_bin_path} -f "KML" #{path}.kml PG:"host=#{@db_configuration[:host]} port=#{@db_configuration[:port]} user=#{@db_configuration[:username]} dbname=#{@db_configuration[:database]}" #{@export_to_file}}

        output = `#{ogr2ogr_command} &> /dev/null`

        Zip::ZipOutputStream.open("#{path}.kmz") do |zia|
          zia.put_next_entry("doc.kml")
          zia.print IO.read("#{path}.kml")
        end
        FileUtils.rm_rf("#{path}.kml")

        log "path: #{path}"
        return OpenStruct.new({
          :name => @export_to_file, 
          :import_type => export_type,
          :path => "#{path}.#{type}"
          })

      end
      if @type == 'shp'

        ogr2ogr_bin_path = `which ogr2ogr`.strip
        ogr2ogr_command = %Q{#{ogr2ogr_bin_path} -f "ESRI Shapefile" #{path}.shp PG:"host=#{@db_configuration[:host]} port=#{@db_configuration[:port]} user=#{@db_configuration[:username]} dbname=#{@db_configuration[:database]}" #{@export_to_file}}

        output = `#{ogr2ogr_command} &> /dev/null`
        
        Zip::ZipOutputStream.open("#{path}.zip") do |zia|
          
          begin
            zia.put_next_entry("#{export_to_file}.shp")
            zia.print IO.read("#{path}.shp")
            FileUtils.rm_rf("#{path}.shp")
          rescue Exception=>e
            # handle e
            log "info #{e}"
          end
        

          begin
            zia.put_next_entry("#{export_to_file}.shx")
            zia.print IO.read("#{path}.shx")
            FileUtils.rm_rf("#{path}.shx")
          rescue Exception=>e
            # handle e
            log "info #{e}"
          end


          begin
            zia.put_next_entry("#{export_to_file}.dbf")
            zia.print IO.read("#{path}.dbf")
            FileUtils.rm_rf("#{path}.dbf")
          rescue Exception=>e
            # handle e
            log "info #{e}"
          end


          begin
            zia.put_next_entry("#{export_to_file}.prj")
            zia.print IO.read("#{path}.prj")
            FileUtils.rm_rf("#{path}.prj")
          rescue Exception=>e
            # handle e
            log "info #{e}"
          end


          begin
            zia.put_next_entry("#{export_to_file}.sbn")
            zia.print IO.read("#{path}.sbn")
            FileUtils.rm_rf("#{path}.sbn")
          rescue Exception=>e
            # handle e
            log "info #{e}"
          end

        end
        
        return OpenStruct.new({
          :name => @export_to_file, 
          :import_type => export_type,
          :path => "#{path}.#{type}"
          })

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
