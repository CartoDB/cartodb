# encoding: utf-8
require 'tempfile'
require 'open3'
require 'fileutils'

module CartoDB
  class GPX
    def initialize(arguments={})
      @data_import    = arguments.fetch(:data_import)
      @path           = arguments.fetch(:path)
      @working_data   = arguments.fetch(:working_data)
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

     # ogr2ogr does not manage well datetime fields in gpx to transform it 
     # to string  in order to import correctly
     ogr2ogr_command = %Q{#{ogr2ogr_bin_path} -fieldTypeToString DateTime -f "ESRI Shapefile" #{shp_file} #{path}}
     
     stdin,  stdout, stderr = Open3.popen3(ogr2ogr_command) 

     unless (err = stderr.read).empty?
      data_import.log_error(err) 
     end
      
     # then choose the track_points file to import
     Dir.foreach(shp_file) do |tmp_path|
        dirname = shp_file
        name    = File.basename(tmp_path) 
        next if name =~ /^(\.|\_{2})/

        name    = name.gsub(' ','_') if name.include? ' '
        #fixes problem of different SHP archive files with different case patterns
        FileUtils.mv("#{dirname}/#{tmp_path}", "#{dirname}/#{name.downcase}") unless File.basename(tmp_path) == name.downcase
        name = name.downcase
        if CartoDB::Importer::SUPPORTED_FORMATS.include?(File.extname(name))
          import_data << {
            ext:            File.extname(name),
            import_type:    '.gpx',
            suggested_name: name_for(name, working_data[:suggested_name]),
            path:           "#{dirname}/#{name}"
          }
        end
     end

     import_data       
    end #process!

    private

    attr_accessor :data_import, :path, :working_data, :import_data

    def name_for(name, suggested_name=nil)
      if suggested_name
        "#{suggested_name}_#{File.basename(name, File.extname(name))}".sanitize
      else
        File.basename(name, File.extname(name)).sanitize
      end
    end #name_for
  end # GPX
end # CartoDB

