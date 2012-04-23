module CartoDB
  module Import
    class KML < CartoDB::Import::Preprocessor

      register_preprocessor :kml
      #register_preprocessor :kmz
      register_preprocessor :json
      register_preprocessor :geojson      
      register_preprocessor :js            

      def process!    
        @data_import = DataImport.find(:id=>@data_import_id)
        # run Chardet + Iconv
        fix_encoding 
        
        ogr2ogr_bin_path = `which ogr2ogr`.strip
        ogr2ogr_command = %Q{#{ogr2ogr_bin_path} -lco dim=2 --config SHAPE_ENCODING LATIN1 -f "ESRI Shapefile" #{@path}.shp #{@path}}
        #-lco DIM=*2* 
        stdin,  stdout, stderr = Open3.popen3(ogr2ogr_command) 
  
        unless (err = stderr.read).empty?
          if err.downcase.include?('failure')
            @data_import.set_error_code(2000)
            @data_import.log_error(err)
            @data_import.log_error("ERROR: failed to convert #{@ext.sub('.','')} to shp")
          
            if err.include? "Geometry Collection"
              @data_import.set_error_code(3201)
              @data_import.log_error("ERROR: geometry contains Geometry Collection")
            end
          
            raise "failed to convert #{@ext.sub('.','')} to shp"
          else
            @data_import.log_update(err)
          end
        end
        
        unless (reg = stdout.read).empty?
          @runlog.stdout << reg
        end

        if File.file?("#{@path}.shp")
          @path = "#{@path}.shp"
          @ext = '.shp'
        elsif File.directory?("#{@path}.shp")
          Dir.foreach("#{@path}.shp") do |entry|
            if File.extname(entry) == ".shp"
              if File.file?("#{@path}.merged.shp")
                ogr2ogr_command = %Q{#{ogr2ogr_bin_path} -f "ESRI Shapefile" -update #{@path}.merged.shp #{@path}.shp/#{entry} -nln merged}
              else
                ogr2ogr_command = %Q{#{ogr2ogr_bin_path} -f "ESRI Shapefile" #{@path}.merged.shp #{@path}.shp/#{entry}}
              end
              #-lco DIM=*2* 
              stdin,  stdout, stderr = Open3.popen3(ogr2ogr_command) 
            end
          end
          @path = "#{@path}.merged.shp"
          @ext = '.shp'
          # rescue
          #   @data_import.set_error_code(2000)
          #   @data_import.log_error("ERROR: failed to convert #{@ext.sub('.','')} to shp")
          #   @runlog.err << "failed to create shp file from #{@ext.sub('.','')}"
          #   raise "failed to convert #{@ext.sub('.','')} to shp"
          # end
        else
          @data_import.set_error_code(2000)
          @data_import.log_error("ERROR: failed to convert #{@ext.sub('.','')} to shp")
          @runlog.err << "failed to create shp file from #{@ext.sub('.','')}"
          raise "failed to convert #{@ext.sub('.','')} to shp"
        end
       debugger
       # construct return variables
       to_import_hash       
      end  
    end
  end    
end