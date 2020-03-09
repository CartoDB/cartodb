require 'fileutils'

module DataRepository
  module Filesystem
    class Local
      DEFAULT_PREFIX = File.join(File.dirname(__FILE__), '..', 'tmp')

      def initialize(base_directory=DEFAULT_PREFIX)
        @base_directory = base_directory
      end

      def create_base_directory
        FileUtils.mkpath @base_directory unless exists? @base_directory
      end

      def store(path, data)
        FileUtils.mkpath(File.dirname(fullpath_for(path)))

        File.open(fullpath_for(path), 'wb') do |file|
          data.rewind if data.eof?
          if data.respond_to?(:bucket)
            data.read { |chunk| file.write(chunk) }
          else
            chunk = data.gets
            while chunk
              file.write(chunk)
              chunk = data.gets
            end
          end
        end
        path
      end

      def fetch(path)
        File.open(fullpath_for(path), 'r')
      end

      def exists?(path)
        File.exists?(fullpath_for(path))
      end

      # Use from controlled environments always
      def remove(path)
        if exists?(path)
          File.delete(fullpath_for(path))
        end
      end

      def fullpath_for(path)
        File.join(base_directory, path)
      end

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
      end

      def dot_directory?(path)
        path == '.' || path == '..'
      end

      def relative_path_for(path, base_directory)
       (path.split('/') - base_directory.split('/')).join('/')
      end
    end
  end
end

