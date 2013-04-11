# encoding: utf-8
require 'tempfile'
require 'fileutils'
require 'iconv'
require_relative '../constants'
require_relative '../exceptions'

module CartoDB
  class UNP
    def initialize(arguments)
      @path           = arguments.fetch(:path)
      @suggested_name = arguments.fetch(:suggested_name)
      @log            = arguments.fetch(:log, String.new)
      @import         = Array.new
    end #initialize

    def process!
      log("Extracting from file #{path}")
      temporary_directory = extract(path)

      crawl(temporary_directory).each do |path|
        import.push(data_for(path)) if supported?(path)
      end

      log("Extraction finished for file: #{path}")
      import
    rescue => exception
      raise ExtractionError
    end #process!

    private

    attr_reader :path, :suggested_name, :import

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
      temporary_directory = generate_tempfile
      current_directory   = Dir.pwd
      unp_command         = "unp #{path}"

      Dir.mkdir(temporary_directory)
      Dir.chdir(temporary_directory)
      result  = `#{unp_command}`
      Dir.chdir(current_directory)

      log(unp_error) and raise(unp_error) if unp_failure?(result)
      temporary_directory
    end #extract

    def data_for(path)
      {
        ext:            File.extname(path),
        suggested_name: name_from(File.basename(path)),
        path:           path
      }
    end #data_for

    def log(message)
      #@log.append("KMZ: #{message}")
    end #log

   def supported?(filename)
      Importer::SUPPORTED_FORMATS.include?(File.extname(filename))
    end #supported?

    def normalize(filename)
      rename(filename, underscore(filename))
    end #normalize

    def underscore(filename)
      Iconv.new('UTF-8//IGNORE', 'UTF-8').iconv(filename)
        .gsub(' ', '_')
        .downcase
    end #underscore

    def name_from(name, suggested_name=nil )
      return suggested_name unless suggested_name.nil?
      File.basename(name, File.extname(name)).sanitize
    end #name_from

    def generate_tempfile
      tempfile    = Tempfile.new("")
      path        = tempfile.path
      tempfile.close!
      path
    end #generate_tempfile

    def rename(origin, destination)
      begin
        FileUtils.mv(origin, destination)
      rescue ArgumentError => e
        raise(e) unless e.message =~ /same file/
      end
      destination
    end #rename

    def hidden?(name)
      name =~ /^(\.|\_{2})/
    end #hidden?

    def unp_error
      "Can't find #{path}"
    end #unp_error

    def unp_failure?(utr)
      utr =~ /.*Cannot read.*/ || $?.exitstatus != 0
    end #unp_failure?
  end # UNP
end # CartoDB

