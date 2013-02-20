# encoding: utf-8 
require 'fileutils'

module DataRepository
  module Filesystem
    class Local
      DEFAULT_PREFIX = File.join(File.dirname(__FILE__), '..', 'tmp')

      def initialize(base_directory=DEFAULT_PREFIX)
        @base_directory = base_directory
      end #initialize

      def store(path, data)
        FileUtils.mkpath( File.dirname( destination_for(path) ) )
        
        File.open(destination_for(path), 'w') do |file|
          while chunk = data.gets
            file.write(chunk) 
          end
        end

        path
      end #store

      def fetch(path)
        File.open(destination_for(path), 'r')
      end #fetch

      private

      attr_reader :base_directory

      def destination_for(path)
        File.join(base_directory, path)
      end #destination_for
    end # Local
  end # Filesystem
end # DataRepository

