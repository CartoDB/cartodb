# encoding: utf-8
require 'fileutils'
require 'open3'
require 'uri'
require_relative './exceptions'
require_relative './source_file'
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
require_relative '../helpers/quota_check_helpers.rb'

# NOTE: Beware that some methods and some parameters are kept since this class is supposed to be
# interchangeable with CartoDB::Importer2::DatasourceDownloader. A better way to have managed
# managed this might have been through inheritance, since Ruby doesn't provide interfaces.

module CartoDB
  module Importer2
    class Downloader
      include CartoDB::Importer2::QuotaCheckHelpers, Carto::UrlValidator

      def self.supported_extensions
        @supported_extensions ||= CartoDB::Importer2::Unp::SUPPORTED_FORMATS
                                  .concat(CartoDB::Importer2::Unp::COMPRESSED_EXTENSIONS)
                                  .sort_by(&:length).reverse
      end

      def self.supported_extensions_match
        @supported_extensions_match ||= supported_extensions.map { |ext|
          ext = ext.gsub('.', '\\.')
          [/#{ext}$/i, /#{ext}(?=\.)/i, /#{ext}(?=\?)/i, /#{ext}(?=&)/i]
        }.flatten
      end

      def self.url_filename_regex
        return @url_filename_regex if @url_filename_regex

        se_match_regex = Regexp.union(supported_extensions_match)
        @url_filename_regex = Regexp.new("[[:word:]-]+#{se_match_regex}+", Regexp::IGNORECASE)
      end

      def provides_stream?
        false
      end

      def http_download?
        true
      end

      def multi_resource_import_supported?
        false
      end

      attr_reader :source_file, :etag, :last_modified, :http_response_code, :datasource

      def initialize(user_id, url, http_options = {}, options = {})
        raise UploadError unless user_id && url

        @user = Carto::User.find(user_id) if user_id
        @translated_url = translate_url(url)
        @http_options = http_options
        @options = options

        @downloaded_bytes = 0
      end

      def run(_available_quota_in_bytes = nil)
        if @translated_url =~ %r{://}
          raise_if_over_storage_quota(requested_quota: content_length || 0,
                                      available_quota: size_limit_in_bytes,
                                      user_id: @user.id)

          modified? ? download_and_store : @source_file = nil
        else
          @source_file = SourceFile.new(@translated_url)
        end

        self
      end

      def modified?
        previous_etag = @http_options.fetch(:etag, false)
        previous_last_modified = @http_options.fetch(:last_modified, false)

        return true unless previous_etag || previous_last_modified

        etag_changed = etag && previous_etag && etag != previous_etag
        last_modified_changed = (last_modified &&
                                 previous_last_modified &&
                                 previous_last_modified.to_i < last_modified.to_i)

        etag_changed || last_modified_changed
      end

      private

      def size_limit_in_bytes
        @size_limit_in_bytes ||= [@user.max_import_file_size, @user.remaining_quota].compact.min
      end

      URL_ESCAPED_CHARACTERS = 'áéíóúÁÉÍÓÚñÑçÇàèìòùÀÈÌÒÙ'.freeze

      def translate_url(url)
        translator = supported_translator(url)

        raw_url = if translator
                    if translator.respond_to?(:rename_destination)
                      @custom_filename = translator.rename_destination(url)
                    end

                    translator.translate(url)
                  else
                    url
                  end

        raw_url.is_a?(String) ? URI.escape(raw_url.strip, URL_ESCAPED_CHARACTERS) : raw_url
      end

      def raise_if_url_invalid(url)
        validate_url!(url)
      rescue Carto::UrlValidator::InvalidUrlError
        raise CartoDB::Importer2::CouldntResolveDownloadError
      end

      def headers
        return @headers if @headers

        response = http_client.head(@translated_url, typhoeus_options)

        @http_response_code = response.code
        if response.success?
          raise_if_url_invalid(response.effective_url || @translated_url)
          @headers = response.headers

          process_headers
        end
      end

      def process_headers
        basename = @custom_filename ||
                   filename_from_headers ||
                   filename_from_url ||
                   SecureRandom.urlsafe_base64

        @filename = filename_with_extension(basename)
      end

      MAX_REDIRECTS = 5
      HTTP_CONNECT_TIMEOUT_SECONDS = 60
      DEFAULT_HTTP_REQUEST_TIMEOUT_SECONDS = 600

      def typhoeus_options
        verify_ssl = @http_options.fetch(:verify_ssl_cert, false)
        cookiejar = Tempfile.new('cookiejar_').path

        {
          cookiefile:       cookiejar,
          cookiejar:        cookiejar,
          followlocation:   true,
          ssl_verifypeer:   verify_ssl,
          ssl_verifyhost:   (verify_ssl ? 2 : 0),
          forbid_reuse:     true,
          connecttimeout:   HTTP_CONNECT_TIMEOUT_SECONDS,
          timeout:          @http_options.fetch(:http_timeout, DEFAULT_HTTP_REQUEST_TIMEOUT_SECONDS),
          maxredirs:        MAX_REDIRECTS
        }
      end

      FILENAME_PREFIX = 'importer_'.freeze

      def download_and_store
        file = Tempfile.new(FILENAME_PREFIX, encoding: 'ascii-8bit')

        bound_request(file).run

        file_path = if @filename
                      new_file_path = File.join(Pathname.new(file.path).dirname, @filename)
                      File.rename(file.path, new_file_path)

                      new_file_path
                    else
                      file.path
                    end

        @source_file = SourceFile.new(file_path, @filename)
      ensure
        file.close
        file.unlink
      end

      def bound_request(file)
        request = http_client.request(@translated_url, typhoeus_options)

        request.on_headers do |response|
          @http_response_code = response.code

          raise_if_url_invalid(response.effective_url || @translated_url)

          response.success? ? process_headers(response.headers) : raise_error_for_response(response)
        end

        request.on_body do |chunk|
          if (@downloaded_bytes += chunk.bytesize) > size_limit_in_bytes
            raise FileTooBigError.new("download file too big (> #{size_limit_in_bytes} bytes)")
          else
            file.write(chunk)
          end
        end

        request.on_complete do |response|
          response.success? ? process_headers(response.headers) : raise_error_for_response(response)
        end

        request
      end

      def raise_error_for_response(response)
        if response.timed_out?
          raise DownloadTimeoutError.new("TIMEOUT ERROR: Body:#{response.body}")
        elsif response.headers['Error'] && response.headers['Error'] =~ /too many nodes/
          raise TooManyNodesError.new(response.headers['Error'])
        elsif response.return_code == :couldnt_resolve_host
          raise CouldntResolveDownloadError.new("Couldn't resolve #{@translated_url}")
        elsif response.code == 401
          raise UnauthorizedDownloadError.new(response.body)
        elsif response.code == 404
          raise NotFoundDownloadError.new(response.body)
        elsif response.return_code == :partial_file
          raise PartialDownloadError.new("DOWNLOAD ERROR: A file transfer was shorter or larger than expected")
        else
          raise DownloadError.new("DOWNLOAD ERROR: Code:#{response.code} Body:#{response.body}")
        end
      end

      def http_client
        @http_client ||= Carto::Http::Client.get('downloader', log_requests: true)
      end

      def content_length
        return @content_length if @content_length

        header_content_length = headers['Content-Length']

        @content_length = header_content_length.to_i if header_content_length
      end

      def etag
        return @etag if @etag

        header_etag = headers['ETag']
        header_etag = header_etag.delete('"').delete("'") if header_etag

        @etag = header_etag
      end

      def last_modified
        return @last_modified if @last_modified

        header_last_modified = headers['Last-Modified']
        @last_modified = if header_last_modified
                           begin
                             DateTime.httpdate(header_last_modified.delete('"').delete("'"))
                           rescue
                             nil
                           end
                         end
      end

      def content_type
        return @content_type if @content_type

        headers_content_type = headers['Content-Type']
        return nil unless headers_content_type.present?

        @content_type = headers_content_type.split(';').first
      end

      URL_TRANSLATORS = [
        UrlTranslator::OSM2,
        UrlTranslator::OSM,
        UrlTranslator::FusionTables,
        UrlTranslator::GitHub,
        UrlTranslator::GoogleMaps,
        UrlTranslator::GoogleDocs,
        UrlTranslator::KimonoLabs
      ].freeze

      def supported_translator(url)
        URL_TRANSLATORS.map(&:new).find { |translator| translator.supported?(url) }
      end

      CONTENT_DISPOSITION_RE = %r{;\s*filename=(.*;|.*)}

      def filename_from_headers
        disposition = headers['Content-Disposition']
        return false unless disposition
        filename = disposition.match(CONTENT_DISPOSITION_RE).to_a[1]
        return false unless filename

        parsed_filename = filename.delete("'").delete('"').split(';').first

        parsed_filename if parsed_filename.present?
      end

      def filename_from_url
        url_name = self.class.url_filename_regex.match(URI.decode(@translated_url)).to_s

        url_name unless url_name.empty?
      end

      CONTENT_TYPES_MAPPING = [
        {
          content_types: ['text/plain'],
          extensions: ['.txt', '.kml', '.geojson']
        },
        {
          content_types: ['text/csv'],
          extensions: ['.csv']
        },
        {
          content_types: ['application/vnd.ms-excel'],
          extensions: ['.xls']
        },
        {
          content_types: ['application/vnd.ms-excel.sheet.binary.macroEnabled.12'],
          extensions: ['.xlsb']
        },
        {
          content_types: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
          extensions: ['.xlsx']
        },
        {
          content_types: ['application/vnd.geo+json'],
          extensions: ['.geojson']
        },
        {
          content_types: ['application/vnd.google-earth.kml+xml'],
          extensions: ['.kml']
        },
        {
          content_types: ['application/vnd.google-earth.kmz'],
          extensions: ['.kmz']
        },
        {
          content_types: ['application/gpx+xml'],
          extensions: ['.gpx']
        },
        {
          content_types: ['application/zip'],
          extensions: ['.zip', '.carto']
        },
        {
          content_types: ['application/x-gzip'],
          extensions: ['.tgz', '.gz']
        },
        {
          content_types: ['application/json', 'text/javascript', 'application/javascript'],
          extensions: ['.json']
        },
        {
          content_types: ['application/osm3s+xml'],
          extensions: ['.osm']
        }
      ].freeze

      def extensions_from_headers
        return @extensions_from_headers if @extensions_from_headers
        return nil unless content_type

        extensions_from_headers_item = CONTENT_TYPES_MAPPING.find do |item|
          item[:content_types].include?(content_type.downcase)
        end

        if extensions_from_headers_item
          @extensions_from_headers ||= extensions_from_headers_item[:extensions]
        end
      end

      def filename_with_extension(filename)
        return filename unless extensions_from_headers

        pathname = Pathname.new(filename)
        file_extension = pathname.extname

        if file_extension.present? && extensions_from_headers.include?(file_extension)
          filename
        else
          "#{pathname.basename('.*')}#{extensions_from_headers.first}"
        end
      end
    end
  end
end
