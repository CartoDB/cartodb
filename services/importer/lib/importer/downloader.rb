# encoding: utf-8
require 'typhoeus'
require 'open3'
require_relative './exceptions'
require_relative './source_file'
require_relative '../../../data-repository/filesystem/local'
require_relative './url_translator/osm'
require_relative './url_translator/osm2'
require_relative './url_translator/fusion_tables'
require_relative './url_translator/github'
require_relative './url_translator/google_maps'
require_relative './url_translator/google_docs'

module CartoDB
  module Importer2
    class Downloader

      DEFAULT_FILENAME        = 'importer'
      CONTENT_DISPOSITION_RE  = %r{;\s*filename=(.*;|.*)}
      URL_RE                  = %r{://}
      URL_TRANSLATORS         = [
                                  UrlTranslator::OSM2,
                                  UrlTranslator::OSM,
                                  UrlTranslator::FusionTables,
                                  UrlTranslator::GitHub,
                                  UrlTranslator::GoogleMaps,
                                  UrlTranslator::GoogleDocs
                                ]

      def initialize(url, http_options={}, seed=nil, repository=nil)
        @url          = url
        raise UploadError if url.nil?

        @http_options = http_options
        @seed         = seed
        @repository   = repository || DataRepository::Filesystem::Local.new(temporary_directory)
      end #initialize

      def run(available_quota_in_bytes=nil)
        set_local_source_file ||
        set_downloaded_source_file(available_quota_in_bytes)
        self
      end

      def set_local_source_file
        return false if valid_url?
        self.source_file = SourceFile.new(url)
        self
      end

      def valid_url?
        url =~ URL_RE
      end

      def set_downloaded_source_file(available_quota_in_bytes=nil)
        raise_if_over_storage_quota(headers, available_quota_in_bytes)
        @etag           = etag_from(headers)
        @last_modified  = last_modified_from(headers)
        return self unless modified?

        response        = download
        headers         = response.headers

        raise DownloadError unless response.code.to_s =~ /\A[23]\d+/
        raise GDriveNotPublicError if gdrive_deny_in?(headers)

        data            = StringIO.new(response.response_body)
        name            = name_from(headers, url)

        @etag           = etag_from(headers)
        @last_modified  = last_modified_from(headers)

        self.source_file  = SourceFile.new(filepath(name), name)
        repository.store(source_file.path, data)
        @checksum = 
          Open3.capture2e(md5_command_for(source_file.fullpath)).first
        self.source_file  = nil unless modified?
        self
      end

      def raise_if_over_storage_quota(headers, available_quota_in_bytes=nil)
        return self unless available_quota_in_bytes
        raise StorageQuotaExceededError if 
          content_length_from(headers) > available_quota_in_bytes.to_i
      end

      def typhoeus_options
        verify_ssl = http_options.fetch(:verify_ssl_cert, true)
        {
          cookiefile:     cookiejar,
          cookiejar:      cookiejar,
          followlocation: true,
          ssl_verifypeer: verify_ssl,
          ssl_verifyhost: (verify_ssl ? 2 : 0)
        }
      end 

      def headers
        @headers ||= Typhoeus.head(translate(url), typhoeus_options).headers
      end

      def cookiejar
        repository.fullpath_for("#{seed}_cookiejar")
      end

      def download
        response = Typhoeus.get(translate(url), typhoeus_options)
        while response.headers['location']
          response = Typhoeus.get(translate(url), typhoeus_options)
        end
        response
      end

      def name_from(headers, url)
        name_from_http(headers) || name_in(url)
      end #filename_from

      def content_length_from(headers)
        headers.fetch('Content-Length', -1).to_i
      end #content_length_from

      def modified?
        previous_etag           = http_options.fetch(:etag, false)
        previous_last_modified  = http_options.fetch(:last_modified, false)
        previous_checksum       = http_options.fetch(:checksum, false)
        etag                    = etag_from(headers)
        last_modified           = last_modified_from(headers)
        checksum                = (defined?(@checksum) ? @checksum : false)

        return true unless (previous_etag || previous_last_modified) 
        return true if previous_etag && etag && previous_etag != etag
        return true if previous_last_modified && last_modified && previous_last_modified.to_i < last_modified.to_i
        return true if previous_checksum && checksum && previous_checksum != checksum
        false
      rescue
        false
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
        last_modified
      end

      attr_reader :source_file, :url, :etag, :last_modified

      private
      
      attr_reader :http_options, :repository, :seed
      attr_writer :source_file

      def translators
        URL_TRANSLATORS.map(&:new)
      end #translators

      def translate(url)
        translator = translators.find { |translator| translator.supported?(url) }
        return url unless translator
        translator.translate(url)
      end #translated_url

      def filename
        [DEFAULT_FILENAME, seed].compact.join('_')
      end #filename

      def filepath(name=nil)
        repository.fullpath_for(name || filename)
      end #filepath

      def name_from_http(headers)
        disposition = headers.fetch('Content-Disposition', nil)
        disposition ||= headers.fetch('Content-disposition', nil)
        return false unless disposition
        filename = disposition.match(CONTENT_DISPOSITION_RE).to_a[1]
        return false unless filename
        filename.delete("'").delete('"').split(';').first
      end #name_from_http

      def name_in(url)
        url.split('/').last.split('?').first
      end #name_in

      def temporary_directory
        return @temporary_directory if @temporary_directory
        tempfile              = Tempfile.new('')
        @temporary_directory  = tempfile.path

        tempfile.close!
        Dir.mkdir(temporary_directory)
        @temporary_directory
      end #temporary_directory

      def gdrive_deny_in?(headers)
        headers.fetch('X-Frame-Options', nil) == 'DENY'
      end

      def md5_command_for(name)
        %Q(md5sum #{name} | cut -d' ' -f1)
      end
    end # Downloader
  end # Importer2
end # CartoDB

