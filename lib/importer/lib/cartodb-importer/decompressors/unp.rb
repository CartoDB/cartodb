module CartoDB
  module Import
    class UNP < CartoDB::Import::Decompressor
      
      register_decompressor :tar
      register_decompressor :zip
      register_decompressor :gz
      register_decompressor :tgz
      

      def process!
        @data_import = DataImport.find(:id=>@data_import_id)
        @data_import.log_update("untar file #{@path}") 
        
        # generate a temp file for import
        tmp_dir = temporary_filename
        
        Dir.mkdir(tmp_dir)
        curdir = Dir.pwd
        Dir.chdir(tmp_dir)
        tarcmd = "unp #{@path}"
        utr = `#{tarcmd}`
        Dir.chdir(curdir)
        
        Dir.foreach(tmp_dir) do |name|
          # temporary filename. no collisions. 
          tmp_path = "#{tmp_dir}/#{name}"
          if File.file?(tmp_path)
          
          
            next if name =~ /^(\.|\_{2})/
            if name.include? ' '
              name = name.gsub(' ','_')
            end

            #fixes problem of different SHP archive files with different case patterns
            name = name.downcase
            
            # add to delete queue
            @entries << tmp_path
          
            if CartoDB::Importer::SUPPORTED_FORMATS.include?(File.extname(name).downcase)
              @ext            = File.extname(name)
              @suggested_name = get_valid_name(File.basename(name,@ext).tr('.','_').downcase.sanitize) if !@force_name
              @path           = tmp_path
              log "Found original @ext file named #{name} in path #{@path}"
              
            end           
          
            # extract
            # entry.extract(tmp_path)
          end
        end

        # construct return variables
        to_import_hash
      end  
    end
  end    
end
