# encoding: utf-8
require 'typhoeus'
require_relative './source_file'
require_relative '../../../data-repository/filesystem/local'
require_relative './url_translator/osm'
require_relative './url_translator/fusion_tables'

module CartoDB
  module Importer2
    class Downloader

      DEFAULT_FILENAME        = 'importer'
      CONTENT_DISPOSITION_RE  = %r{attachment; filename=\"(.*)\"}
      URL_RE                  = %r{://}
      URL_TRANSLATORS         = [UrlTranslator::OSM, UrlTranslator::FusionTables]

      def initialize(url, seed=nil, repository=nil)
        self.url          = url
        self.seed         = seed
        self.repository   = repository || DataRepository::Filesystem::Local.new
      end #initialize

      def run
        unless url =~ URL_RE
          self.source_file = SourceFile.new(url)
          return self
        end

        response          = Typhoeus.get(translate(url), followlocation: true)
        name              = name_from(response.headers, url)
        self.source_file  = SourceFile.new(filepath, name)

        repository.store(source_file.path, StringIO.new(response.response_body))
        self
      end #run

      def name_from(headers, url)
        name_from_http(headers) || name_in(url)
      end #filename_from

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

      def filepath
        repository.fullpath_for(filename)
      end #filepath

      def name_from_http(headers)
        disposition = headers.fetch('Content-Disposition', nil)
        disposition && disposition.match(CONTENT_DISPOSITION_RE)[1]
      end #name_from_http

      def name_in(url)
        url.split('/').last.split('?').first
      end #name_in
    end # Downloader
  end # Importer2
end # CartoDB

