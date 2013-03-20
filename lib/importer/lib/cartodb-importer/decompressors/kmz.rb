# encoding: utf-8
require 'zip/zip'
require 'tempfile'
require 'fileutils'
require_relative '../constants'
require_relative '../exceptions'

module CartoDB
  class KMZ
    def initialize(arguments)
      @path           = arguments.fetch(:path)
      @suggested_name = arguments.fetch(:suggested_name)
      @log            = arguments.fetch(:log, String.new)
      @import         = []
    end #initialize

    def process!
      log("Importing zip file: #{path}")
      log("Extracting from file: #{path}")
      Zip::ZipFile.foreach(path) { |entry| extract(entry) }
      log("Extraction finished for file: #{path}")

      import
    rescue
      raise ExtractionError
    end #process!

    private

    attr_reader :path, :suggested_name, :import

    def extract(entry)
      return if hidden?(entry.name)
      filename       = normalize_filename(entry)
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

    def normalize_filename(entry)
      filename    = entry.name.split('/').last
      normalized  = normalize(filename)
      rename_file(filename, normalized)
      normalized
    end #normalize_filename

    def normalize(filename)
      filename.gsub(' ','_').downcase
    end #normalize

    def name_from(name, suggested_name=nil )
      suggested_name || File.basename(name, File.extname(name)).sanitize
    end #name_from

    def generate_tempfile
      tempfile    = Tempfile.new("")
      path        = tempfile.path
      tempfile.close!
      path
    end #generate_tempfile

    def rename_file(filename, normalized)
      return false if filename == normalized
      FileUtils.mv("#{path}/#{filename}", "#{path}/#{normalized}")
      normalized
    end #rename_file

    def hidden?(name)
      name =~ /^(\.|\_{2})/
    end #dot_directory?
  end # KMZ
end # CartoDB

