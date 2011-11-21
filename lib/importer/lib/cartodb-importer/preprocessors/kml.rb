module CartoDB
  module Import
    class KML < CartoDB::Import::Preprocessor

      register_preprocessor :kml
      register_preprocessor :kmz
      register_preprocessor :json
      register_preprocessor :geojson      
      register_preprocessor :js            

      def process!    
        
        # run Chardet + Iconv
        fix_encoding 
        
        ogr2ogr_bin_path = `which ogr2ogr`.strip
        ogr2ogr_command = %Q{#{ogr2ogr_bin_path} --config SHAPE_ENCODING LATIN1 -f "ESRI Shapefile" #{@path}.shp #{@path}}
        out = `#{ogr2ogr_command}`

        if $?.exitstatus != 0
          raise "failed to convert kml to shp"
        end
        
        if 0 < out.strip.length
          @runlog.stdout << out
        end

        if File.file?("#{@path}.shp")
          @path = "#{@path}.shp"
          @ext = '.shp'
        else
          @runlog.err << "failed to create shp file from kml"
        end
            
       # construct return variables
       to_import_hash       
      end  
    end
  end    
end