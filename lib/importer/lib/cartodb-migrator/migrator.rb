# coding: UTF-8

module CartoDB
  class Migrator
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
      
      # Handle name of table and target name of table
      @suggested_name = get_valid_name(options[:table_name])
      @current_name = options[:table_name]
      
      raise "current_table value can't be nil" if @current_name.nil?

      unless options[:suggested_name].nil? || options[:suggested_name].blank?
        @force_name = true
        @suggested_name = get_valid_name(options[:suggested_name])
      else
        @force_name = false
      end
      
      # Handle DB connection
      @db_configuration = options.slice(:database, :username, :password, :host, :port)
      @db_configuration[:port] ||= 5432
      @db_configuration[:host] ||= '127.0.0.1'
      @db_connection = Sequel.connect("postgres://#{@db_configuration[:username]}:#{@db_configuration[:password]}@#{@db_configuration[:host]}:#{@db_configuration[:port]}/#{@db_configuration[:database]}")

      
    rescue => e
      log $!
      log e.backtrace
      raise e
    end
    
    def migrate!
      
      python_bin_path = `which python`.strip
      psql_bin_path = `which psql`.strip

      # Check if the file had data, if not rise an error because probably something went wrong
      if @db_connection["SELECT * from #{@current_name} LIMIT 1"].first.nil?
        @runlog.err << "Empty table"
        raise "Empty table"
      end
      
      # Sanitize column names where needed
      column_names = @db_connection.schema(@current_name).map{ |s| s[0].to_s }
      need_sanitizing = column_names.each do |column_name|
        if column_name != column_name.sanitize_column_name
          @db_connection.run("ALTER TABLE #{@current_name} RENAME COLUMN \"#{column_name}\" TO #{column_name.sanitize_column_name}")
        end
      end
      
      # attempt to transform the_geom to 4326
      if column_names.include? "the_geom"
        if srid = @db_connection["select st_getsrid(the_geom) from #{@current_name} limit 1"].first
          begin
            if srid != 4326
              # move original geometry column around
              @db_connection.run("UPDATE #{@current_name} SET the_geom = ST_Transform(the_geom, 4326);")
              @db_connection.run("CREATE INDEX #{@current_name}_the_geom_gist ON #{@current_name} USING GIST (the_geom)")
            end
          rescue => e
            @runlog.err << "failed to transform the_geom to 4326 #{@current_name}. #{e.inspect}"
          end
        end
      end

      # if there is no the_geom, and there are latitude and longitude columns, create the_geom
      unless column_names.include? "the_geom"

        latitude_possible_names = "'latitude','lat','latitudedecimal','latitud','lati'"
        longitude_possible_names = "'longitude','lon','lng','longitudedecimal','longitud','long'"

        matching_latitude = nil
        res = @db_connection["select column_name from information_schema.columns where table_name ='#{@current_name}'
          and lower(column_name) in (#{latitude_possible_names}) LIMIT 1"]
        if !res.first.nil?
          matching_latitude= res.first[:column_name]
        end
        matching_longitude = nil
        res = @db_connection["select column_name from information_schema.columns where table_name ='#{@current_name}'
          and lower(column_name) in (#{longitude_possible_names}) LIMIT 1"]
        if !res.first.nil?
          matching_longitude= res.first[:column_name]
        end


        if matching_latitude and matching_longitude
            #we know there is a latitude/longitude columns
            @db_connection.run("SELECT AddGeometryColumn('#{@current_name}','the_geom',4326, 'POINT', 2);")

            @db_connection.run(<<-GEOREF
            UPDATE \"#{@current_name}\"
            SET the_geom =
              ST_GeomFromText(
                'POINT(' || trim(\"#{matching_longitude}\") || ' ' || trim(\"#{matching_latitude}\") || ')', 4326
            )
            WHERE
            trim(CAST(\"#{matching_longitude}\" AS text)) ~ '^(([-+]?(([0-9]|[1-9][0-9]|1[0-7][0-9])(\.[0-9]+)?))|[-+]?180)$'
            AND
            trim(CAST(\"#{matching_latitude}\" AS text))  ~ '^(([-+]?(([0-9]|[1-8][0-9])(\.[0-9]+)?))|[-+]?90)$'
            GEOREF
            )
            @db_connection.run("CREATE INDEX \"#{@current_name}_the_geom_gist\" ON \"#{@current_name}\" USING GIST (the_geom)")
        end
      end


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
