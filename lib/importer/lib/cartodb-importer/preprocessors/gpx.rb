module CartoDB
  module Import
    class GPX < CartoDB::Import::Preprocessor

      register_preprocessor :gpx

      def process!    
      
       @data_import = DataImport.find(:id=>@data_import_id)
       file_data = Array.new
       
       # generate a temporally filename 
       shp_file = temporary_filename(@working_data[:path])
       
       # extract the 3 shp files (and associated dbf and so on)
       # it will create a folder
       ogr2ogr_bin_path = `which ogr2ogr`.strip

       # ogr2ogr does not manage well datetime fields in gpx to transform it to string in 
       # order to import correctly
       ogr2ogr_command = %Q{#{ogr2ogr_bin_path} -fieldTypeToString DateTime -f "ESRI Shapefile" #{shp_file} #{@working_data[:path]}}
       
       stdin,  stdout, stderr = Open3.popen3(ogr2ogr_command) 
  
        unless (err = stderr.read).empty?
          @data_import.log_error(err)
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
          file_data << {
            :ext => File.extname(name),
            :suggested_name =>name.sanitize,
            :path => "#{dirname}/#{name}"
          }
       end
       
       # construct return variables
       file_data       
      end  
    end
  end    
end