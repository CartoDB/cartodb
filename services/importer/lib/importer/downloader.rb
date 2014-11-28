# encoding: utf-8
require 'fileutils'
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
require_relative './url_translator/kimono_labs'
require_relative './unp'

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
                                  UrlTranslator::GoogleDocs,
                                  UrlTranslator::KimonoLabs
                                ]

      def initialize(url, http_options={}, seed=nil, repository=nil)
        @url          = url
        raise UploadError if url.nil?

        @http_options = http_options
        @seed         = seed
        @repository   = repository || DataRepository::Filesystem::Local.new(temporary_directory)
        @datasource

        translators = URL_TRANSLATORS.map(&:new)
        translator = translators.find { |translator| translator.supported?(url) }
        if translator.nil?
          @translated_url = url
          @custom_filename = nil
        else
          @translated_url = translator.translate(url)
          @custom_filename = translator.respond_to?(:rename_destination) ? translator.rename_destination(url) : nil
        end
      end

      def provides_stream?
        false
      end

      def run(available_quota_in_bytes=nil)
        set_local_source_file || set_downloaded_source_file(available_quota_in_bytes)
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

        download_and_store

        self.source_file  = nil unless modified?
        self
      end


      def raise_if_over_storage_quota(headers, available_quota_in_bytes=nil)
        return self unless available_quota_in_bytes
        raise StorageQuotaExceededError if 
          content_length_from(headers) > available_quota_in_bytes.to_i
      end

      def typhoeus_options
        verify_ssl = http_options.fetch(:verify_ssl_cert, false)
        {
          cookiefile:     cookiejar,
          cookiejar:      cookiejar,
          followlocation: true,
          ssl_verifypeer: verify_ssl,
          ssl_verifyhost: (verify_ssl ? 2 : 0)
        }
      end 

      def headers
        @headers ||= Typhoeus.head(@translated_url, typhoeus_options).headers
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
        request = Typhoeus::Request.new(@translated_url, typhoeus_options)
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
          if error_response.headers['Error'] && error_response.headers['Error'] =~ /too many nodes/
            raise TooManyNodesError.new(error_response.headers['Error'])
          else 
            raise DownloadError.new("DOWNLOAD ERROR: Code:#{error_response.code} Body:#{error_response.body}")
          end
        end

        File.rename(temp_name, filepath(name))

        # Just return the source file structure
        self.source_file  = SourceFile.new(filepath(name), name)
      end #download_and_store

      def clean_up
        if defined?(@temporary_directory) \
           && @temporary_directory =~ /^#{CartoDB::Importer2::Unp::IMPORTER_TMP_SUBFOLDER}/ \
           && !(@temporary_directory =~ /\.\./)
          FileUtils.rm_rf @temporary_directory
        end
      end

      def name_from(headers, url, custom=nil)
        name =  custom || name_from_http(headers) || name_in(url)
        if name == nil || name == ''
          random_name
        else
          name
        end
      end #filename_from

      def content_length_from(headers)
        content_length = headers.fetch('Content-Length', nil)
        content_length ||= headers.fetch('Content-length', nil)
        content_length ||= headers.fetch('content-length', -1)
        content_length.to_i
      end #content_length_from

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

      def etag_from(headers)
        etag  =   headers.fetch('ETag', nil)
        etag  ||= headers.fetch('Etag', nil)
        etag  ||= headers.fetch('etag', nil)
        etag  = etag.delete('"').delete("'") if etag
        etag
      end

      def checksum
        etag_from(headers)
      end

      def last_modified_from(headers)
        last_modified =   headers.fetch('Last-Modified', nil)
        last_modified ||= headers.fetch('Last-modified', nil)
        last_modified ||= headers.fetch('last-modified', nil)
        last_modified = last_modified.delete('"').delete("'") if last_modified
        last_modified
      end

      def multi_resource_import_supported?
        false
      end

      attr_reader   :source_file, :datasource, :etag, :last_modified
      attr_accessor :url

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
        disposition ||= headers.fetch('content-disposition', nil)
        return false unless disposition
        filename = disposition.match(CONTENT_DISPOSITION_RE).to_a[1]
        return false unless filename
        filename.delete("'").delete('"').split(';').first
      end #name_from_http

      def name_in(url)
        url.split('/').last.split('?').first
      end #name_in

      def random_name
        random_generator = Random.new
        name = ''
        10.times {
          name << (random_generator.rand*10).to_i.to_s
        }
        name
      end #random_name

      def temporary_directory
        return @temporary_directory if @temporary_directory
        @temporary_directory = Unp.new.generate_temporary_directory.temporary_directory
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

