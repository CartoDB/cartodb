# encoding: utf-8
require 'fileutils'
require 'tempfile'
require 'zip/zip'
require 'iconv'
require_relative '../constants'
require_relative '../exceptions'

module CartoDB
  class KMZ
    def initialize(arguments)
      @path           = arguments.fetch(:path)
      @suggested_name = arguments.fetch(:suggested_name)
      @log            = arguments.fetch(:log, String.new)
      @import         = Array.new
    end #initialize

    def process!
      log("Extracting from file: #{path}")
      Zip::ZipFile.foreach(path) { |entry| extract(entry) }
      log("Extraction finished for file: #{path}")

      import
    rescue => exception
      raise ExtractionError
    end #process!

    private

    attr_reader :path, :suggested_name, :import

    def extract(entry)
      return if hidden?(entry.name)

      filename       = normalize(entry.name)
      temporary_path = "#{generate_tempfile}.#{filename}"

      import.push(data_for(filename, temporary_path)) if supported?(entry.name)
      log("Found original file #{filename} in path #{temporary_path}")
      entry.extract(temporary_path)
    end #extract


    def data_for(name, path)
      {
        ext:            File.extname(name),
        suggested_name: name_from(name, suggested_name),
        path:           path
      }
    end #data_for

    def log(message)
      #@log.append("KMZ: #{message}")
    end #log

    def supported?(filename)
      Importer::SUPPORTED_FORMATS.include?(File.extname(filename))
    end #supported?

    def normalize(path)
      rename(path, underscore(path))
    end #normalize

    def underscore(filename)
      Iconv.new('UTF-8//IGNORE', 'UTF-8').iconv(filename)
        .gsub(' ', '_')
        .downcase
    end #underscore

    def name_from(name, suggested_name=nil )
      suggested_name || File.basename(name, File.extname(name)).sanitize
    end #name_from

    def generate_tempfile
      tempfile    = Tempfile.new("")
      path        = tempfile.path
      tempfile.close!
      path
    end #generate_tempfile

    def rename(origin, destination)
      return destination if origin == destination
      FileUtils.mv(origin, destination)
      destination
    end #rename

    def hidden?(name)
      name =~ /^(\.|\_{2})/
    end #hidden?
  end # KMZ
end # CartoDB

