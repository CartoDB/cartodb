module CartoDB
  module Import
    class KML < CartoDB::Import::Preprocessor

      register_preprocessor :kml

      def process!    
      
       @data_import = DataImport.find(:id=>@data_import_id)
       import_data = Array.new
       
       # generate a temporally filename 
       shp_file = temporary_filename
       
       # extract the 3 shp files (and associated dbf and so on)
       # it will create a folder
       ogr2ogr_bin_path = `which ogr2ogr`.strip
       
       ogr2ogr_command = %Q{#{ogr2ogr_bin_path} -lco dim=2 -skipfailures --config SHAPE_ENCODING UTF8 -f "ESRI Shapefile" #{shp_file} #{@working_data[:path]}}
       
       stdin,  stdout, stderr = Open3.popen3(ogr2ogr_command) 
  
        unless (err = stderr.read).empty?
          if err.downcase.include?('failure')
            if err.include? "Geometry Collection"
              @data_import.set_error_code(3201)
              @data_import.log_error("ERROR: geometry contains Geometry Collection")
            else
              @data_import.set_error_code(2000)
              @data_import.log_error(err)
              @data_import.log_error("ERROR: failed to convert #{@ext.sub('.','')} to shp")
            end
            raise "failed to convert file to shp"
          else
            @data_import.log_update(err)
          end
        end
        
       # then choose the track_points file to import
       Dir.foreach(shp_file) do |tmp_path|
          dirname = shp_file
          name = File.basename(tmp_path) 
          next if name =~ /^(\.|\_{2})/
          if name.include? ' '
            name = name.gsub(' ','_')
          end
          #fixes problem of different SHP archive files with different case patterns
          FileUtils.mv("#{dirname}/#{tmp_path}", "#{dirname}/#{name.downcase}") unless File.basename(tmp_path) == name.downcase
          name = name.downcase
          if CartoDB::Importer::SUPPORTED_FORMATS.include?(File.extname(name))
            if @working_data[:suggested_name]
              suggested = "#{@working_data[:suggested_name]}"
            else
              suggested = File.basename( name, File.extname(name)).sanitize
            end
            import_data << {
              :ext => File.extname(name),
              :import_type => '.kml',
              :suggested_name => suggested,
              :path => "#{dirname}/#{name}"
            }
          end
       end
       # construct return variables
       import_data       
      end  
    end
  end    
end