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

module CartoDB
  module Importer2
    class Downloader

      # in seconds
      HTTP_CONNECT_TIMEOUT = 60
      DEFAULT_HTTP_REQUEST_TIMEOUT = 600
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

      def initialize(url, http_options={}, seed=nil, repository=nil)
        @url          = url
        raise UploadError if url.nil?

        @http_options = http_options
        @seed         = seed
        @repository   = repository || DataRepository::Filesystem::Local.new(temporary_directory)
        @datasource = nil
        @source_file = nil

        translators = URL_TRANSLATORS.map(&:new)
        translator = translators.find { |translator| translator.supported?(url) }
        if translator.nil?
          @translated_url = url
          @custom_filename = nil
        else
          @translated_url = translator.translate(url)
          @custom_filename = translator.respond_to?(:rename_destination) ? translator.rename_destination(url) : nil
        end
        # INFO: runner_spec.rb uses File instead of String, so we chose to support both
        # We only want to escape specific characters
        @translated_url = URI.escape(@translated_url, URL_ESCAPED_CHARACTERS) if !@translated_url.nil? && @translated_url.kind_of?(String)
      end

      def provides_stream?
        false
      end

      def run(available_quota_in_bytes=nil)
        set_local_source_file || set_downloaded_source_file(available_quota_in_bytes)
        self
      end

      def clean_up
        if defined?(@temporary_directory) &&
           @temporary_directory =~ /^#{CartoDB::Importer2::Unp::IMPORTER_TMP_SUBFOLDER}/ &&
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

      attr_reader   :source_file, :datasource, :etag, :last_modified
      attr_accessor :url

      private
      
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
          connecttimeout:  HTTP_CONNECT_TIMEOUT,
          timeout:          http_options.fetch(:http_timeout, DEFAULT_HTTP_REQUEST_TIMEOUT)
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
          unless response.success?
            download_error = true
            error_response = response
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
          random_name
        else
          name
        end
        name_with_extension(name, headers)
      end

      def name_with_extension(name, headers)
        return name if content_type.nil? || content_type.empty?
        extension = File.extname(name)
        return name unless extension.nil? || extension.empty?
        extension_from_content_type = content_type_extension(content_type)
        return name if extension_from_content_type.nil?
        "#{name}.#{extension_from_content_type}"
      end

      def content_type_extension(content_type)
        case content_type
        when %r{^text/plain}
          'txt'
        when %r{^text/csv}
          'csv'
        when %r{^application/vnd.ms-excel}
          'xls'
        when %r{^application/vnd.ms-excel.sheet.binary.macroEnabled.12}
          'xlsb'
        when %r{^application/vnd.openxmlformats-officedocument.spreadsheetml.sheet}
          'xlsx'
        when %r{^application/vnd.geo+json}
          'geojson'
        when %r{^application/vnd.google-earth.kml+xml}
          'kml'
        when %r{^application/vnd.google-earth.kmz}
          'kmz'
        when %r{^application/gpx+xml}
          'gpx'
        when %r{^application/zip}
          'zip'
        when %r{^application/json}
          'json'
        when %r{^text/javascript}
          'json'
        when %r{^application/javascript}
          'json'
        else
          nil
        end
      end

      def content_length_from(headers)
        content_length = headers.fetch('Content-Length', nil)
        content_length ||= headers.fetch('Content-length', nil)
        content_length ||= headers.fetch('content-length', -1)
        content_length.to_i
      end

      def etag_from(headers)
        etag  =   headers.fetch('ETag', nil)
        etag  ||= headers.fetch('Etag', nil)
        etag  ||= headers.fetch('etag', nil)
        etag  = etag.delete('"').delete("'") if etag
        etag
      end

      def last_modified_from(headers)
        last_modified =   headers.fetch('Last-Modified', nil)
        last_modified ||= headers.fetch('Last-modified', nil)
        last_modified ||= headers.fetch('last-modified', nil)
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
        headers.fetch('Content-Type', nil) ||
          headers.fetch('Content-type', nil) ||
          headers.fetch('content-type', nil)
      end

      def name_from_http(headers)
        disposition = headers.fetch('Content-Disposition', nil)
        disposition ||= headers.fetch('Content-disposition', nil)
        disposition ||= headers.fetch('content-disposition', nil)
        return false unless disposition
        filename = disposition.match(CONTENT_DISPOSITION_RE).to_a[1]
        return false unless filename
        filename.delete("'").delete('"').split(';').first
      end

      def name_in(url)
        url.split('/').last.split('?').first
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
        @temporary_directory = Unp.new.generate_temporary_directory.temporary_directory
      end

      def gdrive_deny_in?(headers)
        headers.fetch('X-Frame-Options', nil) == 'DENY'
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

