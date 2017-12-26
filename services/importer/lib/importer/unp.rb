# encoding: utf-8
require 'tempfile'
require 'fileutils'
require 'open3'
require_relative './exceptions'
require_relative './source_file'
require_relative './kml_splitter'
require_relative './gpx_splitter'
require_relative './osm_splitter'

module CartoDB
  module Importer2
    class Unp
      HIDDEN_FILE_REGEX     = /^(\.|\_{2})/
      COMPRESSED_EXTENSIONS = %w{ .zip .gz .tgz .tar.gz .bz2 .tar .kmz .rar .carto }.freeze
      SUPPORTED_FORMATS     = %w{
        .csv .shp .ods .xls .xlsx .tif .tiff .kml .kmz
        .js .json .tar .gz .tgz .osm .bz2 .geojson .gpkg
        .gpx .tab .tsv .txt
      }
      SPLITTERS = [KmlSplitter, OsmSplitter, GpxSplitter]

      DEFAULT_IMPORTER_TMP_SUBFOLDER = '/tmp/imports/'

      attr_reader :source_files, :temporary_directory

      def initialize(importer_config = nil, ogr2ogr_config = nil)
        @source_files = []
        @ogr2ogr_config = ogr2ogr_config
        if !importer_config.nil? && !importer_config['unp_temporal_folder'].nil?
          @temporal_subfolder_path = importer_config['unp_temporal_folder']
        end
      end

      def get_temporal_subfolder_path
        @temporal_subfolder_path ||= DEFAULT_IMPORTER_TMP_SUBFOLDER
      end

      # Uncompress, yields the block with the files as argument, and cleanups
      def open(compressed_file_path)
        run(compressed_file_path)
        yield(source_files)
      ensure
        clean_up
      end

      def run(path)
        return without_unpacking(path) unless compressed?(path)
        extract(path)
        crawl(temporary_directory).each { |dir_path| process(dir_path) }
        @source_files = split(source_files)
        self
      end

      def without_unpacking(path)
        raise NotAFileError if !File.file?(path)

        local_path = "#{temporary_directory}/#{File.basename(path)}"
        FileUtils.cp(path, local_path)
        self.source_files.push(source_file_for(normalize(local_path)))
        @source_files = split(source_files)
        self
      end

      def compressed?(path)
        COMPRESSED_EXTENSIONS.include?(File.extname(path).downcase)
      end

      def process(path)
        source_files.push(source_file_for(path)) if supported?(path)
      end

      def crawl(path, files=[])
        Dir.foreach(path) do |subpath|
          raise EncodingError unless filename_valid_encoding?(subpath)
          next if hidden?(subpath)
          next if subpath =~ /.*readme.*\.txt/i
          next if subpath =~ /\.version\.txt/i

          fullpath = normalize("#{path}/#{subpath}")
          (crawl(fullpath, files) and next) if File.directory?(fullpath)
          files.push(fullpath)
        end

        files
      end

      def extract(path)
        raise ExtractionError unless File.exists?(path)

        local_path = "#{temporary_directory}/#{File.basename(path)}"
        FileUtils.cp(path, local_path)


        path = normalize(local_path)
        current_directory = Dir.pwd
        Dir.chdir(temporary_directory)

        stdout, stderr, status = safe_unp_path(path) do |safe_path|
          Open3.capture3(*command_for(safe_path))
        end

        Dir.chdir(current_directory)

        if unp_failure?(stdout + stderr, status)
          puts "stdout: #{stdout}"
          puts "stderr: #{stderr}"
          puts "status: #{status}"
          if stderr =~ /incorrect password/
            raise PasswordNeededForExtractionError
          else
            raise ExtractionError.new(stderr)
          end
        end
        FileUtils.rm(path)
        self
      end

      def source_file_for(path)
        source_file = SourceFile.new(path)
        source_file.layer = 'track_points' if source_file.extension =~ /\.gpx/
        source_file
      end

      def command_for(path)
        stdout, stderr, status = Open3.capture3('which unp')
        if status != 0
          puts "Cannot find command 'unp' (required for import task) #{stderr}"
          raise InstallError
        end
        unp_path = stdout.chop
        puts "Path to 'unp': #{unp_path} -- stderr was #{stderr} and status was #{status}" if (stderr.size > 0)

        command = [unp_path, path, '--']
        if !(path.end_with?('.tar.gz') || path.end_with?('.tgz') || path.end_with?('.tar'))
          # tar doesn't allows -o, which doesn't makes too much sense as each import comes in a different folder
          command << '-o'
        end
        if path.end_with?('.zip')
          # There's no "fail if password needed" parameter, so we always send a password.
          # If it's not needed it's ignored, and if it's needed it will fail
          command += ['-P', 'fail-if-prompts-for-password']
        end
        command
      end

      def supported?(filename)
        SUPPORTED_FORMATS.include?(File.extname(filename).downcase)
      end

      def filename_valid_encoding?(filename)
        filename.force_encoding("UTF-8").valid_encoding?
      end

      def normalize(filename)
        normalized = underscore(filename)
        rename(filename, normalized)
        normalized
      end

      def underscore(filename)
        filename.encode('UTF-8')
          .gsub(' ', '_')
          .gsub(/\(/, '')
          .gsub(/\)/, '')
          .gsub(/'/, '')
          .gsub(/"/, '')
          .gsub(/&/, '')
          .downcase
          .gsub(/\.txt/, '.csv')
          .gsub(/\.tsv/, '.csv')
      end

      def rename(origin, destination)
        return self if origin == destination
        File.rename(origin, destination)
        self
      end

      def clean_up
        FileUtils.rm_rf temporary_directory
      end

      def generate_temporary_directory
        tempfile                  = temporary_file
        self.temporary_directory  = tempfile.path

        tempfile.close!
        Dir.mkdir(temporary_directory)
        self
      end

      def hidden?(name)
        !!(name =~ HIDDEN_FILE_REGEX)
      end

      def unp_failure?(output, exit_code)
        (exit_code != 0)
      end

      # Return a new temporary file contained inside a tmp subfolder
      def temporary_file
        FileUtils.mkdir_p(get_temporal_subfolder_path) unless File.directory?(get_temporal_subfolder_path)
        Tempfile.new('', get_temporal_subfolder_path)
      end

      def temporary_directory
        generate_temporary_directory unless @temporary_directory
        @temporary_directory
      end

      def split(source_files)
        source_files.flat_map { |source_file|
          splitter = splitter_for(source_file)
          if splitter
            splitter.new(source_file, temporary_directory, @ogr2ogr_config)
              .run.source_files
          else
            source_file
          end
        }
      end

      def splitter_for(source_file)
        SPLITTERS.select { |splitter| splitter.support?(source_file) }
          .first
      end

      private

      attr_reader :job
      attr_writer :temporary_directory

      def safe_unp_path(path)
        # To avoid wrong format detection by unp (see #11954), force the format
        if path.end_with?('.carto')
          new_path = "#{path}.zip"
          FileUtils.mv(path, new_path)
          begin
            return yield(new_path)
          ensure
            FileUtils.mv(new_path, path)
          end
        else
          yield(path)
        end
      end
    end
  end
end
