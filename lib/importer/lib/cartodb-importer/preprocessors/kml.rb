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
        import_data = Array.new
        # run Chardet + Iconv
        fix_encoding 
        
        # generate a temporally filename 
        tmp_file = temporary_filename
        
        ogr2ogr_bin_path = `which ogr2ogr`.strip
        ogr2ogr_command = %Q{#{ogr2ogr_bin_path} -lco dim=2 -skipfailures --config SHAPE_ENCODING UTF8 -f "ESRI Shapefile" #{tmp_file} #{@working_data[:path]}}
        #-lco DIM=*2* 
        stdin,  stdout, stderr = Open3.popen3(ogr2ogr_command) 
  
        unless (err = stderr.read).empty?
          if err.downcase.include?('failure')
            if err.include? "Geometry Collection"
              @data_import.set_error_code(3201)
              @data_import.log_error("ERROR: geometry contains Geometry Collection")
            elsif ['.json','.geojson','.js'].include? @working_data[:ext]
              @data_import.set_error_code(3007)
              @data_import.log_error(err)
              @data_import.log_error("ERROR: failed to convert #{@working_data[:ext].sub('.','')} to shp")
            else
              @data_import.set_error_code(2000)
              @data_import.log_error(err)
              @data_import.log_error("ERROR: failed to convert #{@working_data[:ext].sub('.','')} to shp")
            end
            raise "failed to convert file to shp"
          else
            @data_import.log_update(err)
          end
        end
        
        unless (reg = stdout.read).empty?
          @runlog.stdout << reg
        end
        
        if File.file?("#{tmp_file}")
          dirname = File.dirname("#{tmp_file}") 
          orig = File.basename("#{tmp_file}")
          name = File.basename("#{tmp_file}") 
          if name.include? ' '
            name = name.gsub(' ','_')
          end
          #fixes problem of different SHP archive files with different case patterns
          FileUtils.mv("#{dirname}/#{orig}", "#{dirname}/#{name.downcase}") unless orig == name.downcase
          name = name.downcase
          import_data << {
            :ext => File.extname(name),
            :import_type => @working_data[:ext],
            :suggested_name => "#{@working_data[:suggested_name]}",
            :path => "#{dirname}/#{name}"
          }
        elsif File.directory?("#{tmp_file}") #multi-layer kml support
          Dir.foreach("#{tmp_file}") do |entry|
            if File.extname(entry) == ".shp"
              dirname = File.dirname("#{tmp_file}/#{entry}") 
              orig = File.basename("#{tmp_file}/#{entry}")
              name = File.basename("#{tmp_file}/#{entry}") 
              if name.include? ' '
                name = name.gsub(' ','_')
              end
              #fixes problem of different SHP archive files with different case patterns
              FileUtils.mv("#{dirname}/#{orig}", "#{dirname}/#{name.downcase}") unless orig == name.downcase
              name = name.downcase
              import_data << {
                :ext => '.shp',
                :import_type => @working_data[:ext],
                :suggested_name => File.basename( name, File.extname(name)).sanitize,
                :path => "#{dirname}/#{name}"
              }
            end
          end
        else
          @data_import.set_error_code(2000)
          @data_import.log_error("ERROR: failed to convert #{@working_data[:ext].sub('.','')} to shp")
          @runlog.err << "failed to create shp file from #{@working_data[:ext].sub('.','')}"
          raise "failed to convert #{@working_data[:ext].sub('.','')} to shp"
        end
       # construct return variables
       import_data       
      end  
    end
  end    
end