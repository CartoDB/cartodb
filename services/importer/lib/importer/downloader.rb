# encoding: utf-8
require 'typhoeus'
require_relative './exceptions'
require_relative './source_file'
require_relative '../../../data-repository/filesystem/local'
require_relative './url_translator/osm'
require_relative './url_translator/fusion_tables'
require_relative './url_translator/github'
require_relative './url_translator/google_maps'
require_relative './url_translator/google_docs'

module CartoDB
  module Importer2
    class Downloader

      DEFAULT_FILENAME        = 'importer'
      CONTENT_DISPOSITION_RE  = %r{attachment; filename=(.*;|.*)}
      URL_RE                  = %r{://}
      URL_TRANSLATORS         = [
                                  UrlTranslator::OSM,
                                  UrlTranslator::FusionTables,
                                  UrlTranslator::GitHub,
                                  UrlTranslator::GoogleMaps,
                                  UrlTranslator::GoogleDocs
                                ]

      def initialize(url, seed=nil, repository=nil)
        self.url          = url
        raise UploadError if url.nil?
        self.seed         = seed
        self.repository   = repository || 
                            DataRepository::Filesystem::Local.new(temporary_directory)
      end #initialize

      def run(available_quota_in_bytes=nil)
        unless url =~ URL_RE
          self.source_file = SourceFile.new(url)
          return self
        end

        response          = Typhoeus.head(translate(url), followlocation: true)
        if content_length_from(response) > available_quota_in_bytes.to_i
          raise StorageQuotaExceededError if available_quota_in_bytes
        end

        response          = Typhoeus.get(translate(url), followlocation: true)
        name              = name_from(response.headers, url)
        self.source_file  = SourceFile.new(filepath(name), name)

        repository.store(source_file.path, StringIO.new(response.response_body))
        self
      end #run

      def name_from(headers, url)
        name_from_http(headers) || name_in(url)
      end #filename_from

      def content_length_from(response)
        response.headers.fetch('Content-Length', -1).to_i
      end #content_length_from

      attr_reader :source_file
      attr_reader :url

      private
      
      attr_accessor :repository, :seed
      attr_writer   :url, :source_file

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
        tempfile              = Tempfile.new("")
        @temporary_directory  = tempfile.path

        tempfile.close!
        Dir.mkdir(temporary_directory)
        @temporary_directory
      end #temporary_directory
    end # Downloader
  end # Importer2
end # CartoDB

