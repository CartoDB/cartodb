# encoding: utf-8
require 'tempfile'

module CartoDB
  class KMZ
    # TODO: do we really need this still?
    attr_accessor :data_import, :path, :suggested_name, :tmp_dir

    def initialize(arguments)
      @path           = arguments.fetch(:path)
      @suggested_name = arguments.fetch(:suggested_name)
      @data_import    = arguments.fetch(:data_import)
      tempfile        = Tempfile.new("")
      @tmp_dir        = tempfile.path
      tempfile.close!
    end #initialize

    def process!
      data_import.log_update("Importing zip file: #{path}")
      import_data     = []

      data_import.log_update("Decompressing file: #{path}")
      Zip::ZipFile.foreach(path) do |entry|
        name = entry.name.split('/').last
        orig = name
        next if name =~ /^(\.|\_{2})/

        # cleans spaces out of archived file names
        name = name.gsub(' ','_')

        #fixes problem of different SHP archive files 
        # with different case patterns
        unless name == orig.downcase
          FileUtils.mv("#{path}/#{orig}", "#{path}/#{name.downcase}") 
        end 
        name = name.downcase

        # temporary filename. no collisions.
        tmp_path = "#{tmp_dir}.#{name}"

        if CartoDB::Importer::SUPPORTED_FORMATS.include?(File.extname(name))
          import_data << {
            ext:            File.extname(name),
            suggested_name: name_from(name, suggested_name),
            path:           tmp_path
          }
          data_import.log_update(
            "Found original @ext file named #{name} in path #{path}"
          )
        end
        entry.extract(tmp_path)
      end

      import_data
    end #process!

    private

    def name_from(name, suggested_name=nil )
      return suggested_name unless suggested_name.nil?
      File.basename(name, File.extname(name)).sanitize
    end #name_from
  end # KMZ
end # CartoDB

