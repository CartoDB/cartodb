module CartoDB
  module Import
    class GPX < CartoDB::Import::Preprocessor

      register_preprocessor :gpx

      def process!    
       # generate a temporally filename 
       shp_file = temporary_filename(@path)

       # extract the 3 shp files (and associated dbf and so on)
       # it will create a folder
       ogr2ogr_bin_path = `which ogr2ogr`.strip

       # ogr2ogr does not manage well datetime fields in gpx to transform it to string in 
       # order to import correctly
       ogr2ogr_command = %Q{#{ogr2ogr_bin_path} -fieldTypeToString DateTime -f "ESRI Shapefile" #{shp_file} #{@path}}
       out = `#{ogr2ogr_command}`

       if $?.exitstatus != 0
         raise "failed to convert gpx to shp"
       end

       track_points = "#{shp_file}/track_points.shp"
       @runlog.stdout << track_points

       # then choose the track_points file to import
       if Dir.exists?(shp_file) and File.file?(track_points)
         # add all files to entries to be removed
         # add the path too in order to remove it 
         @entries = Dir["#{shp_file}/*"]
         @entries << shp_file

         @path = track_points

         # get the file to import and set extension to shp
         @ext = '.shp'
       else
         @runlog.err << "failed to create shp file from GPX"
       end
       
       # construct return variables
       to_import_hash       
      end  
    end
  end    
end