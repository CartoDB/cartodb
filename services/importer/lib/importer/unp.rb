# encoding: utf-8
require 'tempfile'
require 'fileutils'
require 'open3'
require_relative '../importer'
require_relative './exceptions'
require_relative './kml_splitter'
require_relative './osm_splitter'

module CartoDB
  module Importer2
    class Unp
      HIDDEN_FILE_REGEX     = /^(\.|\_{2})/
      UNP_READ_ERROR_REGEX  = /.*Cannot read.*/
      COMPRESSED_EXTENSIONS = %w{ .zip .gz .tgz .tar.gz .bz2 .tar .kmz }
      SUPPORTED_FORMATS     = %w{
        .csv .shp .ods .xls .xlsx .tif .tiff .kml .kmz
        .js .json .tar .gz .tgz .osm .bz2 .geojson 
        .gpx .sql .tab .tsv .txt
      }
      SPLITTERS             = [KmlSplitter, OsmSplitter]

      attr_reader :source_files

      def initialize
        @source_files = []
      end #initialize

      def run(path)
        return without_unpacking(path) unless compressed?(path)
        extract(path)
        crawl(temporary_directory).each { |path| process(path) }
        @source_files = split(source_files)
        self
      rescue => exception
        puts exception.to_s
        puts exception.backtrace
        raise exception #ExtractionError
      end #run

      def without_unpacking(path)
        local_path = "#{temporary_directory}/#{File.basename(path)}"
        FileUtils.cp(path, local_path)
        self.source_files.push(source_file_for(normalize(local_path)))
        @source_files = split(source_files)
        self
      end #without_unpacking

      def compressed?(path)
        COMPRESSED_EXTENSIONS.include?(File.extname(path))
      end #compressed?

      def process(path)
        source_files.push(source_file_for(path)) if supported?(path)
      end #process

      def crawl(path, files=[])
        Dir.foreach(path) do |subpath|
          next if hidden?(subpath)
          next if subpath =~ /.*readme.*\.txt/i

          fullpath = normalize("#{path}/#{subpath}")
          (crawl(fullpath, files) and next) if File.directory?(fullpath)
          files.push(fullpath)
        end # foreach

        files
      end #crawl

      def extract(path)
        raise ExtractionError unless File.exists?(path)

        local_path = "#{temporary_directory}/#{File.basename(path)}"
        FileUtils.cp(path, local_path)

        path = normalize(local_path)
        current_directory = Dir.pwd
        Dir.chdir(temporary_directory)
        stdout, stderr, status  = Open3.capture3(command_for(path))
        Dir.chdir(current_directory)

        if unp_failure?(stdout + stderr, status)
          puts "stdout: #{stdout}"
          puts "stderr: #{stderr}"
          puts "status: #{status}"
          raise ExtractionError
        end
        FileUtils.rm(path)
        self
      end #extract

      def source_file_for(path)
        source_file = SourceFile.new(path)
        source_file.layer = 'track_points' if source_file.extension =~ /\.gpx/
        source_file
      end #source_file_for

      def command_for(path)
        stdout, stderr, status  = Open3.capture3("which unp")
        if (status != 0)
          puts "Cannot find command 'unp' (required for import task) #{stderr}"
          raise InstallError # TODO: use InstallError instead ! See #310
        end
        unp_path = stdout.chop
        puts "Path to 'unp': #{unp_path} -- stderr was #{stderr} and status was #{status}"
        "#{unp_path} #{path} -- -o"
      end #command_for

     def supported?(filename)
        SUPPORTED_FORMATS.include?(File.extname(filename))
      end #supported?

      def normalize(filename)
        normalized = underscore(filename)
        rename(filename, normalized)
        normalized
      end #normalize

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
      end #underscore

      def rename(origin, destination)
        return self if origin == destination
        File.rename(origin, destination)
        self
      end #rename

      def clean_up
        FileUtils.rm_rf temporary_directory
      end #clean_up

      def generate_temporary_directory
        tempfile                  = Tempfile.new("")
        self.temporary_directory  = tempfile.path

        tempfile.close!
        Dir.mkdir(temporary_directory)
        self
      end #generate_temporary_directory

      def hidden?(name)
        !!(name =~ HIDDEN_FILE_REGEX)
      end #hidden?

      def unp_failure?(output, exit_code)
        !!(output =~ UNP_READ_ERROR_REGEX) || (exit_code != 0)
      end #unp_failure?

      def temporary_directory
        generate_temporary_directory unless @temporary_directory
        @temporary_directory
      end #temporary_directory

      def split(source_files)
        source_files.flat_map { |source_file|
          splitter = splitter_for(source_file)
          if splitter
            splitter.new(source_file, temporary_directory)
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
    end # Unp
  end # Importer2
end # CartoDB

