# encoding: utf-8
require 'tempfile'
require 'open3'
require 'fileutils'

module CartoDB
  class KML
    def initialize(arguments={})
      @data_import    = arguments.fetch(:data_import)
      @path           = arguments.fetch(:path)
      @working_data   = arguments.fetch(:working_data)
      @ext            = arguments.fetch(:ext)
      @import_data    = Array.new
    end #initialize

    def process!    
     # generate a temporally filename 
     tempfile        = Tempfile.new("")
     shp_file        = tempfile.path
     tempfile.close!
     
     # extract the 3 shp files (and associated dbf and so on)
     # it will create a folder
     ogr2ogr_bin_path = `which ogr2ogr`.strip
     
     ogr2ogr_command = %Q{#{ogr2ogr_bin_path} -lco dim=2 -skipfailures --config SHAPE_ENCODING UTF8 -f "ESRI Shapefile" #{shp_file} #{working_data[:path]}}

     stdin, stdout, stderr = Open3.popen3(ogr2ogr_command)
      
      err = stderr.read
      if err.to_s[/^ERROR \d+:.*/]
        if err.include? "Geometry Collection"
          data_import.set_error_code(3201)
          data_import.log_error("ERROR: geometry contains Geometry Collection")
        else
          data_import.set_error_code(2000)
          data_import.log_error(err)
          data_import.log_error("ERROR: failed to convert #{ext.sub('.','')} to shp")
        end
        raise "failed to convert file to shp"
      else
        data_import.log_update(err)
      end
      
     # then choose the track_points file to import
     Dir.foreach(shp_file) do |tmp_path|
        dirname = shp_file
        name    = File.basename(tmp_path) 
        next if name =~ /^(\.|\_{2})/

        name = name.gsub(' ','_') if name.include? ' '
        #fixes problem of different SHP archive files with different case patterns
        FileUtils.mv("#{dirname}/#{tmp_path}", "#{dirname}/#{name.downcase}") unless File.basename(tmp_path) == name.downcase
        name = name.downcase
        if CartoDB::Importer::SUPPORTED_FORMATS.include?(File.extname(name))
          import_data << {
            ext:            File.extname(name),
            import_type:    '.kml',
            suggested_name: name_for(name, working_data[:suggested_name]),
            path:           "#{dirname}/#{name}"
          }
        end
     end

     import_data       
    end #process! 

    private

    attr_accessor :data_import, :path, :working_data, :import_data, :ext

    def name_for(name, suggested_name=nil)
      return suggested_name if suggested_name
      File.basename(name, File.extname(name)).sanitize
    end #name_for
  end # KML
end # CartoDB

