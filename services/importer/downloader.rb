# encoding: utf-8
require 'typhoeus'
require_relative '../data-repository/filesystem/local'

module CartoDB
  module Importer
    class Downloader
      DEFAULT_FILENAME        = 'importer_download'
      CONTENT_DISPOSITION_RE  = %r{attachment; filename=\"(.*)\"}

      def initialize(url, seed=nil, repository=nil)
        self.url        = url
        self.filepath   = filepath_from(seed)
        self.candidate  = {}
        self.repository = repository || DataRepository::Filesystem::Local.new
      end #initialize

      def run
        return self unless url =~ %r{://}

        response        = Typhoeus.get(url, followlocation: true)
        filename        = filename_from(response.headers, url)
        self.candidate  = candidate_for(filename, filepath)

        repository.store(filepath, StringIO.new(response.response_body))
        self
      end #run

      def filename_from(headers, url)
        filename_from_http(headers) || filename_in(url)
      end #filename_from

      attr_reader :url, :candidate

      private
      
      attr_accessor :filepath, :repository
      attr_writer :url, :candidate

      def candidate_for(filename, filepath)
        extension = File.extname(filename)
        path = DataRepository::Filesystem::Local::DEFAULT_PREFIX + '/' + filepath

        {
          name:         File.basename(filename, extension),
          extension:    extension,
          path:         path
        }
      end #candidate_for

      def filepath_from(seed=nil)
        [DEFAULT_FILENAME, seed].compact.join('_')
      end #filepath_from

      def filename_from_http(headers)
        disposition = headers.fetch('Content-Disposition', nil)
        disposition && disposition.match(CONTENT_DISPOSITION_RE)[1]
      end #filename_from_http

      def filename_in(url)
        url.split('/').last
      end #filename_in
    end # Downloader
  end # Importer
end # CartoDB

