# coding: utf-8 

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
          # sample first 500 lines from source
          lines = []
          File.open(@path) do |f|             
            500.times do
              line = f.gets || break
              lines << line
            end            
          end

          # detect encoding for sample
          cd = CharDet.detect(lines.join)
          
          # Only do non-UTF8 if we're quite sure. (May fail)        
          if (cd.confidence > 0.7)             
            tf = Tempfile.new(@path)                  
            `iconv -f #{cd.encoding}//TRANSLIT//IGNORE -t UTF-8 #{@path} > #{tf.path}`
            `mv -f #{tf.path} #{@path}`                
            tf.close!
          end  
        rescue => e
          #raise e
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