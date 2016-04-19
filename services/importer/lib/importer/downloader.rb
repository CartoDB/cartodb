# encoding: utf-8
require 'fileutils'
require 'open3'
require 'uri'
require_relative './exceptions'
require_relative './source_file'
require_relative '../../../data-repository/filesystem/local'
require_relative './url_translator/osm'
require_relative './url_translator/osm2'
require_relative './url_translator/fusion_tables'
require_relative './url_translator/github'
require_relative './url_translator/google_maps'
require_relative './url_translator/google_docs'
require_relative './url_translator/kimono_labs'
require_relative './unp'
require_relative '../../../../lib/carto/http/client'
require_relative '../../../../lib/carto/url_validator'

module CartoDB
  module Importer2
    class Downloader

      extend Carto::UrlValidator

      # in seconds
      HTTP_CONNECT_TIMEOUT = 60
      DEFAULT_HTTP_REQUEST_TIMEOUT = 600
      MAX_REDIRECTS = 5
      URL_ESCAPED_CHARACTERS = 'áéíóúÁÉÍÓÚñÑçÇàèìòùÀÈÌÒÙ'

      DEFAULT_FILENAME        = 'importer'
      CONTENT_DISPOSITION_RE  = %r{;\s*filename=(.*;|.*)}
      URL_RE                  = %r{://}
      URL_TRANSLATORS         = [
                                  UrlTranslator::OSM2,
                                  UrlTranslator::OSM,
                                  UrlTranslator::FusionTables,
                                  UrlTranslator::GitHub,
                                  UrlTranslator::GoogleMaps,
                                  UrlTranslator::GoogleDocs,
                                  UrlTranslator::KimonoLabs
                                ]

      CONTENT_TYPES_MAPPING = [
        {
          content_types: ['text/plain'],
          extensions: ['txt', 'kml', 'geojson']
        },
        {
          content_types: ['text/csv'],
          extensions: ['csv']
        },
        {
          content_types: ['application/vnd.ms-excel'],
          extensions: ['xls']
        },
        {
          content_types: ['application/vnd.ms-excel.sheet.binary.macroEnabled.12'],
          extensions: ['xlsb']
        },
        {
          content_types: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
          extensions: ['xlsx']
        },
        {
          content_types: ['application/vnd.geo+json'],
          extensions: ['geojson']
        },
        {
          content_types: ['application/vnd.google-earth.kml+xml'],
          extensions: ['kml']
        },
        {
          content_types: ['application/vnd.google-earth.kmz'],
          extensions: ['kmz']
        },
        {
          content_types: ['application/gpx+xml'],
          extensions: ['gpx']
        },
        {
          content_types: ['application/zip'],
          extensions: ['zip']
        },
        {
          content_types: ['application/x-gzip'],
          extensions: ['tgz','gz']
        },
        {
          content_types: ['application/json', 'text/javascript', 'application/javascript'],
          extensions: ['json']
        }
      ]

      def self.supported_extensions
        @supported_extensions ||= CartoDB::Importer2::Unp::SUPPORTED_FORMATS
                                  .concat(CartoDB::Importer2::Unp::COMPRESSED_EXTENSIONS)
                                  .sort_by(&:length).reverse
      end

      def self.url_filename_regex
        @url_filename_regex ||= Regexp.new(
                                 "[[:word:]]+#{Regexp.union(supported_extensions)}+",
                                 true)
      end

      def initialize(url, http_options = {}, options = {}, seed = nil, repository = nil)
        @url = url
        raise UploadError if url.nil?

        @http_options = http_options
        @importer_config = options[:importer_config]
        @ogr2ogr_config = options[:ogr2ogr]
        @seed         = seed
        @repository   = repository || DataRepository::Filesystem::Local.new(temporary_directory)
        @datasource = nil
        @source_file = nil
        @http_response_code = nil

        translators = URL_TRANSLATORS.map(&:new)
        translator = translators.find { |translator| translator.supported?(url) }
        if translator.nil?
          @translated_url = url
          @custom_filename = nil
        else
          @translated_url = translator.translate(url)
          @custom_filename = translator.respond_to?(:rename_destination) ? translator.rename_destination(url) : nil
        end
        @translated_url = clean_url(@translated_url)
      end

      def provides_stream?
        false
      end

      def http_download?
        true
      end

      def run(available_quota_in_bytes=nil)
        set_local_source_file || set_downloaded_source_file(available_quota_in_bytes)
        self
      end

      def clean_up
        if defined?(@temporary_directory) &&
           @temporary_directory =~ /^#{Unp.new(@importer_config, @ogr2ogr_config).get_temporal_subfolder_path}/ &&
           !(@temporary_directory =~ /\.\./)
          FileUtils.rm_rf @temporary_directory
        end
      end

      def modified?
        previous_etag           = http_options.fetch(:etag, false)
        previous_last_modified  = http_options.fetch(:last_modified, false)
        etag                    = etag_from(headers)
        last_modified           = last_modified_from(headers)

        return true unless (previous_etag || previous_last_modified)
        return true if previous_etag && etag && previous_etag != etag
        return true if previous_last_modified && last_modified && previous_last_modified.to_i < last_modified.to_i
        false
      rescue
        false
      end

      def checksum
        etag_from(headers)
      end

      def multi_resource_import_supported?
        false
      end

      def set_limits(limits={})
        # not supported
      end

      attr_reader :source_file, :datasource, :etag, :last_modified, :http_response_code
      attr_accessor :url

      private

      def clean_url(url)
        return url if url.nil? || !url.kind_of?(String)

        url = url.strip
        url = URI.escape(url, URL_ESCAPED_CHARACTERS)

        url
      end

      attr_reader :http_options, :repository, :seed
      attr_writer :source_file

      def set_local_source_file
        return false if valid_url?
        self.source_file = SourceFile.new(url)
        self
      end

      def set_downloaded_source_file(available_quota_in_bytes=nil)
        raise_if_over_storage_quota(headers, available_quota_in_bytes)
        @etag           = etag_from(headers)
        @last_modified  = last_modified_from(headers)
        return self unless modified?

        download_and_store

        self.source_file  = nil unless modified?
        self
      end

      def raise_if_over_storage_quota(headers, available_quota_in_bytes=nil)
        return self unless available_quota_in_bytes
        raise StorageQuotaExceededError if
          content_length_from(headers) > available_quota_in_bytes.to_i
      end

      def headers
        @headers ||= http_client.head(@translated_url, typhoeus_options).headers
      end

      def typhoeus_options
        verify_ssl = http_options.fetch(:verify_ssl_cert, false)
        {
          cookiefile:       cookiejar,
          cookiejar:        cookiejar,
          followlocation:   true,
          ssl_verifypeer:   verify_ssl,
          ssl_verifyhost:   (verify_ssl ? 2 : 0),
          forbid_reuse:     true,
          connecttimeout:   HTTP_CONNECT_TIMEOUT,
          timeout:          http_options.fetch(:http_timeout, DEFAULT_HTTP_REQUEST_TIMEOUT),
          maxredirs:        MAX_REDIRECTS
        }
      end

      def cookiejar
        repository.fullpath_for("#{seed}_cookiejar")
      end

      def download_and_store
        name = ''
        download_error = false
        error_response = nil

        temp_name = filepath(DEFAULT_FILENAME << '_' << random_name)

        downloaded_file = File.open(temp_name, 'wb')
        request = http_client.request(@translated_url, typhoeus_options)

        request.on_headers do |response|
          @http_response_code = response.code if !response.code.nil?

          unless response.success?
            download_error = true
            error_response = response
          end

          # If there is any redirection we want to check again if
          # the final IP is in the IP blacklist
          if response.redirect_count.to_i > 0
            begin
              CartoDB::Importer2::Downloader.validate_url!(response.effective_url)
            rescue Carto::UrlValidator::InvalidUrlError
              raise CartoDB::Importer2::CouldntResolveDownloadError
            end
          end
        end

        request.on_body do |chunk|
          downloaded_file.write(chunk)
        end
        request.on_complete do |response|
          unless response.success?
            download_error = true
            error_response = response
          end
          downloaded_file.close

          # Header hash keys can take advantage of typhoeus case insensitive
          # headers lookup (https://github.com/typhoeus/typhoeus/issues/227)
          headers = response.headers
          name            = name_from(headers, url, @custom_filename)
          @etag           = etag_from(headers)
          @last_modified  = last_modified_from(headers)
        end
        request.run

        if download_error && !error_response.nil?
          if error_response.timed_out?
            raise DownloadTimeoutError.new("TIMEOUT ERROR: Body:#{error_response.body}")
          elsif error_response.headers['Error'] && error_response.headers['Error'] =~ /too many nodes/
            raise TooManyNodesError.new(error_response.headers['Error'])
          elsif error_response.return_code == :couldnt_resolve_host
            raise CouldntResolveDownloadError.new("Couldn't resolve #{@translated_url}")
          elsif error_response.code == 401
            raise UnauthorizedDownloadError.new(error_response.body)
          elsif error_response.code == 404
            raise NotFoundDownloadError.new(error_response.body)
          elsif error_response.return_code == :partial_file
            raise PartialDownloadError.new("DOWNLOAD ERROR: A file transfer was shorter or larger than expected")
          else
            raise DownloadError.new("DOWNLOAD ERROR: Code:#{error_response.code} Body:#{error_response.body}")
          end
        end

        File.rename(temp_name, filepath(name))

        # Just return the source file structure
        self.source_file  = SourceFile.new(filepath(name), name)
      end

      def name_from(headers, url, custom=nil)
        name =  custom || name_from_http(headers) || name_in(url)

        if name == nil || name == ''
          name = random_name
        end

        name_with_extension(name, headers)
      end

      def extensions_by_content_type(content_type)
        downcased_content_type = content_type.downcase
        CONTENT_TYPES_MAPPING.each do |item|
          if item[:content_types].include?(downcased_content_type)
            return item[:extensions]
          end
        end
        return []
      end

      def name_with_extension(name, headers)
        # No content-type
        return name if content_type.nil? || content_type.empty?

        content_type_extensions = extensions_by_content_type(content_type)
        # We don't have extension registered for that content-type
        return name if content_type_extensions.empty?

        file_extension = File.extname(name).split('.').last
        name_without_extension = File.basename(name, ".*")

        #If there is no extension or file extension match in the content type extensions, add content type
        #extension to the file name deleting the previous extension (if exist)
        if (file_extension.nil? || file_extension.empty?) || !content_type_extensions.include?(file_extension)
          return "#{name_without_extension}.#{content_type_extensions.first}"
        else
          return name
        end
      end

      def content_length_from(headers)
        content_length = headers['Content-Length'] || -1
        content_length.to_i
      end

      def etag_from(headers)
        etag = headers['ETag']
        etag = etag.delete('"').delete("'") if etag
        etag
      end

      def last_modified_from(headers)
        last_modified = headers['Last-Modified']
        last_modified = last_modified.delete('"').delete("'") if last_modified
        if last_modified
          begin
            last_modified = DateTime.httpdate(last_modified)
          rescue
            last_modified = nil
          end
        end
        last_modified
      end

      def valid_url?
        url =~ URL_RE
      end

      def translators
        URL_TRANSLATORS.map(&:new)
      end

      def translate(url)
        translator = translators.find { |translator| translator.supported?(url) }
        return url unless translator
        translator.translate(url)
      end

      def filename
        [DEFAULT_FILENAME, seed].compact.join('_')
      end

      def filepath(name=nil)
        repository.fullpath_for(name || filename)
      end

      def content_type
        media_type = headers['Content-Type']
        return nil unless media_type
        media_type.split(';').first
      end

      def name_from_http(headers)
        disposition = headers['Content-Disposition']
        return false unless disposition
        filename = disposition.match(CONTENT_DISPOSITION_RE).to_a[1]
        return false unless filename
        filename.delete("'").delete('"').split(';').first
      end

      def name_in(url)
        url_name = self.class.url_filename_regex.match(url).to_s

        url_name if !url_name.empty?
      end

      def random_name
        random_generator = Random.new
        name = ''
        10.times {
          name << (random_generator.rand*10).to_i.to_s
        }
        name
      end

      def temporary_directory
        return @temporary_directory if @temporary_directory
        @temporary_directory = Unp.new(@importer_config).generate_temporary_directory.temporary_directory
      end

      def gdrive_deny_in?(headers)
        headers['X-Frame-Options'] == 'DENY'
      end

      def md5_command_for(name)
        %Q(md5sum #{name} | cut -d' ' -f1)
      end

      def http_client
        @http_client ||= Carto::Http::Client.get('downloader', log_requests: true)
      end
    end
  end
end

