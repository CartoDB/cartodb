# coding: UTF-8
require 'iconv'
require_relative './decompressors/kmz'
require_relative './decompressors/unp'
require_relative './preprocessors/gpx'
require_relative './preprocessors/json'
require_relative './preprocessors/kml'
require_relative './preprocessors/xls'

require_relative './loaders/csv'
require_relative './loaders/exxxxppp'
require_relative './loaders/osm'
require_relative './loaders/shp'
require_relative './loaders/sql'
require_relative './loaders/tif'

module CartoDB
  class Importer
    RESERVED_COLUMN_NAMES = %W{ oid tableoid xmin cmin xmax cmax ctid }
    SUPPORTED_FORMATS     = %W{ .csv .shp .ods .xls .xlsx .tif .tiff .kml .kmz .js .json .tar .gz .tgz .osm .bz2 .geojson .gpx .json .sql }

    attr_accessor :import_from_file, :db_configuration, :db_connection,
                  :append_to_table, :suggested_name, :ext
    attr_reader   :force_name

    # Initialiser has to get the file in a standard location on the filesystem
    def initialize(options = {})
      @entries          = [] #will contain all files created on disk
      @table_entries    = [] #will contain all tables attempted to be created on disk
      @runlog           = OpenStruct.new :log => [], :stdout => [], :err => []
      @data_import      = DataImport.find(id: options.fetch(:data_import_id))
      @remaining_quota  = options[:remaining_quota]
      @remaining_tables = options[:remaining_tables]
      @append_to_table  = options[:append_to_table]
      @working_data     = nil;
      @db_configuration = options.slice :database, :username, :password, :host, :port
      @db_configuration = {:port => 5432, :host => '127.0.0.1'}.merge @db_configuration
      @db_connection    = Sequel.connect("postgres://#{@db_configuration[:username]}:#{@db_configuration[:password]}@#{@db_configuration[:host]}:#{@db_configuration[:port]}/#{@db_configuration[:database]}")

      # Setup candidate file
      @import_from_file = options[:import_from_file]

      @import_from_file = options[:import_from_url] if options[:import_from_url]

      raise "import_from_file value can't be blank" if @import_from_file.blank?

      # Setup suggested name
      if options[:suggested_name]
        @force_name     = true
        @suggested_name = get_valid_name(options[:suggested_name])
      else
        @force_name = false
      end

      if @import_from_file.is_a?(String)

        @import_from_file.strip!
        @filesrc = nil
        @fromuri = false

        # URL cleaning stuff
        if @import_from_file =~ /^http/
          @import_from_file = fix_openstreetmap_url(@import_from_file) if @import_from_file =~ /openstreetmap.org/
          @import_from_file = parse_url(URI.escape(@import_from_file.strip))

          # KML from FusionTables urls were not coming with extensions
          @filesrc = "fusiontables" if @import_from_file =~ /fusiontables/

          @fromuri = true
        end

        begin
          # Try to open file normally, or open-uri to download/open
          open(@import_from_file) do |res|
            @data_import.file_ready
            file_name = File.basename(@import_from_file)
            @ext = File.extname(file_name).downcase

            # Try to infer file extension from http Content-Disposition
            if @ext.blank? && res.meta.present? && res.meta["content-disposition"].present?
              @ext = res.meta["content-disposition"][/filename="?.*(\.[a-zA-Z1-9]*)"?/, 1].to_s.downcase
            end

            # If the former didn't work, try to infer file extension from http Content-Type
            if @ext.blank? && res.meta.present? && res.meta["content-type"].present?
              set = Mime::LOOKUP[res.meta["content-type"]]
              @ext = ".#{set.instance_variable_get("@symbol").to_s}" if set
            end

            # Fix for extensionless fusiontables files
            if @filesrc == "fusiontables"
              @ext = ".kml"
            elsif @import_from_file =~ /openstreetmap.org/
              @ext              = ".osm"
            elsif @ext==".gz" and @import_from_file.include?(".tar.gz")
              @ext=".tgz"
            end

            @iconv ||= Iconv.new('UTF-8//IGNORE', 'UTF-8')
            @original_name ||= get_valid_name(File.basename(@iconv.iconv(@import_from_file), @ext).downcase.sanitize)

            @import_from_file = Tempfile.new([@original_name, @ext], :encoding => 'utf-8')
            @import_from_file.write res.read.force_encoding("UTF-8")
            @import_from_file.close
          end
        rescue OpenURI::HTTPError => exception
          process_download_error(@import_from_file, exception)
        end

      else
        original_filename = if @import_from_file.respond_to?(:original_filename)
                              @import_from_file.original_filename
                            else
                              @import_from_file.path
                            end
        @ext = File.extname(original_filename)
        @suggested_name ||= get_valid_name(File.basename(original_filename,@ext).tr('.','_').downcase.sanitize)
      end

      # finally setup current path
      @path = @import_from_file.respond_to?(:tempfile) ? @import_from_file.tempfile.path : @import_from_file.path

      # Final ext check in case the file was falsely transfered as .SHP for example
      if ['','.shp','.csv'].include? @ext
        @ext = check_if_zip_or_gzip(@path, @ext)
        if @ext==""
          @ext=".csv"
        end
      end
      @data_import.file_ready
    rescue => e
      @data_import.log_error(e)
      raise e
    end

    # core import method
    #
    # Has 3 expansion points
    #
    # * decompression (eg zip, gzip, bz)
    # * preprocessing (transpose data into a format recognised by loader, eg. gpx)
    # * loader (loads the data into postgres, eg csv, shp)
    #
    def import!
      begin
        fs = File.size(@path)
        if fs.to_i == 0
          @data_import.set_error_code(1005)
          @data_import.log_error("File contains no information, check it locally" )
          raise "File contains no information, check it locally"
        elsif @remaining_quota < (0.3*fs)
          disk_quota_overspend = (File.size(@path) - @remaining_quota).to_int
          @data_import.set_error_code(8001)
          @data_import.log_error("#{disk_quota_overspend / 1024}KB more space is required" )
          raise CartoDB::QuotaExceeded, "#{disk_quota_overspend / 1024}KB more space is required"
        end

        errors = Array.new
        suggested = @suggested_name.nil? ? get_valid_name(File.basename(@original_name,@ext).tr('.','_').downcase.sanitize) : @suggested_name


        # All imports start with only one file, so 'import_data' is an array of
        # on length = 1
        import_data = [{
          :ext            => @ext,
          :path           => @path,
          :suggested_name => suggested
        }]

        # A record of all file paths for cleanup
        @entries << @path

        # TODO: A Zip -> KMZ/Zip will fail because it wont know 
        # how to go back and do the Decompressor stage again
        decompressor  = decompressor_for(@ext)
        import_data   = decompressor.process! if decompressor

        @data_import.log_update('file unzipped') if import_data
        @data_import.reload

        # Preprocess data and update self with results
        # preprocessors are expected to return a hash datastructure

        processed_imports = Array.new
        import_data.each do |data|
          @entries << data[:path]
          @working_data = data
          @working_data[:suggested_name] = get_valid_name(@working_data[:suggested_name])
          preprocessor = preprocessor_for(data.fetch(:ext))
          @data_import.refresh

          if preprocessor
            begin
              out = preprocessor.process!

              # Return raw data if preprocessor returns false
              # For example: we don't want to run JSON preprocessor
              # on GEOJSON files
              if out == false
                processed_imports << data
              else
                out.each { |d| processed_imports << d }
                @data_import.log_update('file preprocessed')
              end
            rescue
              @data_import.reload
              errors << OpenStruct.new(
                description:  @data_import.get_error_text[:title],
                stack:        @data_import.get_error_text[:what_about],
                code:         @data_import.error_code
              )
            end
          else
            processed_imports << data
          end
        end

        # Load data in
        payloads = Array.new
        processed_imports.each do |data|
          @entries << data[:path]
          @working_data = data
          # re-check suggested_name in the case that it has been taken by another in this import
          @working_data[:suggested_name] = @suggested_name.nil? ? get_valid_name(@working_data[:suggested_name]) : get_valid_name(@suggested_name)
          @data_path = data[:path]

          loader = loader_for(data.fetch(:ext))

          if !loader
            @data_import.log_update("no importer for this type of data, #{@ext}")
            @data_import.set_error_code(1002)
          else
            begin

              out = loader.process!

              out.each { |d| payloads << d }
              @data_import.log_update("#{data[:ext]} successfully loaded")
            rescue => e
              @data_import.reload
              errors << OpenStruct.new(
                description:  @data_import.get_error_text[:title],
                stack:        @data_import.log_json,
                code:         @data_import.error_code
              )
            end
          end
        end

        # Check if user is over table quota, raise the appropiate error
        @data_import.raise_error_if_over_quota payloads.length

        @data_import.refresh

        # Flag the data import as failed when no files were imported,
        # save imported table names otherwise
        if payloads.length > 0
          @data_import.tables_created_count = payloads.size
          @data_import.table_names = payloads.map(&:name).join(',')
          @data_import.log_update("#{payloads.size} tables imported")
        else
          @data_import.failed
        end

        @data_import.save
        return [payloads, errors]
      rescue => e
        @data_import.refresh
        drop_created_tables payloads.map(&:name)
        raise e
      ensure
        @db_connection.disconnect
        cleanup_disk
        if @import_from_file.is_a?(File) && File.file?(@import_from_file.path)
          File.unlink(@import_from_file)
        elsif @import_from_file.is_a? Tempfile
          @import_from_file.unlink
        end
        @data_import.save if @data_import
      end
    end

    def drop_created_tables(table_names)
      begin
        table_names.each do |name|
          @db_connection.drop_table name
        end
      rescue # silent try to drop the table
      end
    end


    def cleanup_disk
      @entries = @entries.sort_by {|x| x.length}.reverse
      @entries.each { |filename|
        begin
          # ensure we remove the file from disk
          File.delete(filename)
        rescue
          begin
            Dir.delete(filename)
          rescue
            # file/dir path is incorrect or doesn't exist
          end
        end
      }
    end


    def check_if_zip_or_gzip(path, ext)
      is_utf = if `uname` =~ /Darwin/
                 `file -bI #{@path}`
               else
                 `file -bi #{@path}`
               end
      if is_utf.include? 'zip'
        ext = '.zip'
      elsif is_utf.include? 'gzip'
        ext = '.gz'
      end
      ext
    end

    def process_download_error(url, exception_caught)
      url = URI.parse(url)
      if url.host == 'api.openstreetmap.org'
        exception_caught.io.rewind
        if exception_caught.io.read =~ CartoDB::OSM::API_LIMIT_REACHED_REGEX
          @data_import.set_error_code(1009)
          raise @data_import.get_error_text[:what_about]
        end
      end

      @data_import.set_error_code(1008)
      @data_import.log_error("")
      raise "Couldn't download the file, check the URL and try again."
    end

    private

    def parse_url(url)
      return url unless url.starts_with?('http')
      uri = URI(url)
      url = "#{uri.scheme}://#{uri.host}:#{uri.port}#{uri.path}"
      url += "?#{uri.query}" if uri.query.present?
      url
    end

    def fix_openstreetmap_url url
      return url if url =~ /api.openstreetmap.org/

      params = Rack::Utils.parse_query(url.split('?')[1])
      #2h, 6w
      lon = params['lon'].to_f
      lat = params['lat'].to_f
      zm = params['zoom'].to_i

      dw = 1200.0/2.0
      dh = 1000.0/2.0

      res = 180 / 256.0 / 2**zm
      py = (90 + lat) / res
      px = (180 + lon) / res
      lpx = px - dw
      lpy = py - dh
      upx = px + dw
      upy = py + dh

      lon1 = (res * lpx) - 180
      lat1 = (res * lpy) - 90
      lon2 = (res * upx) - 180
      lat2 = (res * upy) - 90

      return "http://api.openstreetmap.org/api/0.6/map?bbox=#{lon1},#{lat1},#{lon2},#{lat2}"
    end

    def get_valid_name(name)
      Table.get_valid_table_name(name, connection: @db_connection)
    end #get_valid_name

    DECOMPRESSORS = {
      tar:      CartoDB::UNP,
      zip:      CartoDB::UNP,
      gz:       CartoDB::UNP,
      tgz:      CartoDB::UNP,
      kmz:      CartoDB::KMZ
    }

    PREPROCESSORS = {
      gpx:      CartoDB::GPX,
      kml:      CartoDB::KML,
      json:     CartoDB::JSON,
      xls:      CartoDB::XLS,
      xlsx:     CartoDB::XLS,
      ods:      CartoDB::XLS
    }

    LOADERS = {
      csv:      CartoDB::CSV,
      txt:      CartoDB::CSV,
      geojson:  CartoDB::CSV,
      js:       CartoDB::CSV,
      json:     CartoDB::CSV,
      gml:      CartoDB::CSV,
      sql:      CartoDB::SQL,
      exxxxppp: CartoDB::Exxxxppp,
      bz2:      CartoDB::OSM,
      osm:      CartoDB::OSM,
      tif:      CartoDB::TIF,
      tiff:     CartoDB::TIF,
      shp:      CartoDB::SHP
    }

    def decompressor_for(extension)
      key = extension.to_s.delete('.').to_sym
      return false unless DECOMPRESSORS.keys.include?(key)

      DECOMPRESSORS.fetch(key).new(
        data_import:    @data_import,
        path:           @path,
        suggested_name: @suggested_name
      )
    end #decompressor_for

    def preprocessor_for(extension)
      key = extension.to_s.delete('.').to_sym
      return false unless PREPROCESSORS.keys.include?(key)

      PREPROCESSORS.fetch(key).new(
        data_import:    @data_import,
        path:           @path,
        working_data:   @working_data,
        ext:            @ext
      )
    end #preprocessor_for

    def loader_for(extension)
      key = extension.to_s.delete('.').to_sym
      return false unless LOADERS.keys.include?(key)

      LOADERS.fetch(key).new(
        entries:          @entries,
        data_import:      @data_import,
        db:               @db_connection,
        db_configuration: @db_configuration,
        working_data:     @working_data,
        import_from_file: @import_from_file
      )
    end #preprocessor_for
  end # Importer
end # CartoDB

