# parent factory class to manage 
module CartoDB
  module Import
    module Util
      def temporary_filename(prefix="")
        tf = Tempfile.new(prefix)
        tempname = tf.path 
        tf.close! 
        return tempname
      end
    
      # datatype that is passed around
      def to_import_hash
        {
          :import_from_file => @import_from_file,
          :db_configuration => @db_configuration,
          :db_connection    => @db_connection,
          :append_to_table  => @append_to_table,
          :force_name       => @force_name,
          :suggested_name   => @suggested_name,
          :ext              => @ext,
          :path             => @path,
          :python_bin_path  => @python_bin_path,
          :psql_bin_path    => @psql_bin_path,
          :entries          => @entries,
          :runlog           => @runlog,
          :import_type      => @import_type
        }
      end  
          
      # updates instance variables with return values from decompressors, preprocessors and loaders
      def update_self obj
        obj.each do |k,v|
          instance_variable_set("@#{k}", v) if v
        end
      end    
      
      def get_valid_name(name)
        #check if the table name starts with a number
        if !(name[0,1].to_s.match(/\A[+-]?\d+?(\.\d+)?\Z/) == nil)
          name="_#{name}"
        end
        existing_names = @db_connection["select relname from pg_stat_user_tables WHERE schemaname='public' and relname ilike '#{name}%'"].map(:relname)
        testn = 1
        uniname = name
        while true==existing_names.include?("#{uniname}")
          uniname = "#{name}_#{testn}"
          testn = testn + 1
        end
        return uniname
      end

      def fix_encoding
        begin
          # read source
          contents = File.open(@path).read
        
          # detect encoding
          cd = CharDet.detect(contents)
          
          # force utf8
          output  = cd.confidence > 0.6 ? Iconv.conv("#{cd.encoding}//TRANSLIT//IGNORE", "UTF-8", contents) : Iconv.conv("UTF-8//TRANSLIT//IGNORE", "UTF-8", contents)
                
          # output to file
          file = File.new(@path, 'w')
          file.write(output)
          file.close
        rescue Iconv::IllegalSequence => e
          #silently fail here and try importing anyway
          log "ICONV failed for CSV #{@path}: #{e.message} #{e.backtrace}"
        end
      end  
      
      def log str            
        #puts str # if @@debug
      end
      
    end
  end    
end