# encoding: utf-8 
require 'fileutils'
require 'zip/zip'

module DataRepository
  module Filesystem
    class Local
      DEFAULT_PREFIX = File.join(File.dirname(__FILE__), '..', 'tmp')

      def initialize(base_directory=DEFAULT_PREFIX)
        @base_directory = base_directory
      end #initialize

      def store(path, data)
        FileUtils.mkpath( File.dirname( fullpath_for(path) ) )

        File.open(fullpath_for(path), 'wb') do |file|
          data.read { |chunk| file.write(chunk)}
        end if data.respond_to?(:bucket)
        
        File.open(fullpath_for(path), 'wb') do |file|
          while chunk = data.gets
            file.write(chunk) 
          end
        end unless data.respond_to?(:bucket)

        path
      end #store

      def fetch(path)
        File.open(fullpath_for(path), 'r')
      end #fetch

      def exists?(path)
        File.exists?(fullpath_for(path))
      end #exists?

      def zip(path)
        zip_path            = "#{fullpath_for(path)}.zip"
        zip_base_directory  = File.dirname(fullpath_for(path))

        Zip::ZipFile.open(zip_path, 1) do |zip|
          targets_for(path).each do |path|
            zip.add(relative_path_for(path, zip_base_directory), path)
          end
        end

        relative_path_for(zip_path, base_directory)
      end #zip

      def unzip(zip_path)
        Zip::ZipFile.open(fullpath_for(zip_path)) do |zipfile|
          zipfile.each do |entry|
            next if entry.directory?
            self.store(entry.name, entry.get_input_stream)
          end
        end
      end #unzip

      def fullpath_for(path)
        File.join(base_directory, path)
      end #fullpath_for

      private

      attr_reader :base_directory

      def targets_for(path)
        fullpath = fullpath_for(path)
        [ 
          Dir.glob(fullpath),
          Dir.glob("#{fullpath}/*"),
          Dir.glob("#{fullpath}/**/*")
        ].flatten
          .uniq
          .delete_if { |entry| dot_directory?(entry) }
      end #targets_for

      def dot_directory?(path)
        path == '.' || path == '..'
      end #dot_directory?

      def relative_path_for(path, base_directory)
       (path.split('/') - base_directory.split('/')).join('/')
      end #relative_path_for
    end # Local
  end # Filesystem
end # DataRepository

