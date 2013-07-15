# encoding: utf-8
require 'tempfile'
require 'fileutils'
require 'iconv'
require 'open3'
require_relative '../importer'
require_relative './exceptions'

module CartoDB
  module Importer2
    class Unp
      HIDDEN_FILE_REGEX     = /^(\.|\_{2})/
      UNP_READ_ERROR_REGEX  = /.*Cannot read.*/

      attr_reader :source_files, :temporary_directory

      def initialize(job)
        @job          = job
        @source_files = []
      end #initialize

      def run(path)
        extract(path)
        crawl(temporary_directory).each { |path| process(path) }

        self
      rescue => exception
        raise ExtractionError
      end #run

      def process(path)
        source_files.push(source_file_for(path)) if supported?(path)
      end #process

      def crawl(path, files=[])
        Dir.foreach(path) do |subpath|
          next if hidden?(subpath)

          fullpath = normalize("#{path}/#{subpath}")
          (crawl(fullpath, files) and next) if File.directory?(fullpath)
          files.push(fullpath)
        end # foreach

        files
      end #crawl

      def extract(path)
        generate_temporary_directory
        current_directory   = Dir.pwd

        Dir.chdir(temporary_directory)
        stdout, stderr, status  = Open3.capture3(command_for(path))
        Dir.chdir(current_directory)

        raise ExtractionError if unp_failure?(stdout + stderr, status)
        self
      end #extract

      def source_file_for(path)
        SourceFile.new(path)
      end #source_file_for

      def command_for(path)
        "`which unp` #{path}"
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
        Iconv.new('UTF-8//IGNORE', 'UTF-8').iconv(filename)
          .gsub(' ', '_')
          .downcase
      end #underscore

      def rename(origin, destination)
        return self if origin == destination
        FileUtils.mv(origin, destination)
        self
      end #rename

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

      private

      attr_reader :job
      attr_writer :temporary_directory
    end # Unp
  end # Importer2
end # CartoDB

