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
        import_data = []
        
        # generate a temp file for import
        tmp_dir = temporary_filename
        
        Dir.mkdir(tmp_dir)
        curdir = Dir.pwd
        Dir.chdir(tmp_dir)
        tarcmd = "unp #{@path}"
        utr = `#{tarcmd}`
        Dir.chdir(curdir)
        
        
        files = Array.new
        # create a list of all files in the directory and 
        # any directories one level below. I was running into issues 
        # of files being created in a dir, so not getting processed.
        # this fixes
        Dir.foreach(tmp_dir) do |name|
          # temporary filename. no collisions. 
          tmp_path = "#{tmp_dir}/#{name}"
          if File.file?(tmp_path)
            files << tmp_path
          elsif File.directory?(tmp_path)
            unless ['.','..','__MACOSX'].include?(name)
              Dir.foreach(tmp_path) do |subname|
                tmp_sub = "#{tmp_dir}/#{name}/#{subname}"
                if File.file?(tmp_sub)
                  files << tmp_sub
                end
              end
            end
          end
        end
        # now with the list of potential files
        # find out if we have a winner
        files.each do |tmp_path| 
          if File.file?(tmp_path)
            dirname = File.dirname(tmp_path) 
            name = File.basename(tmp_path) 
            next if name =~ /^(\.|\_{2})/
            if name.include? ' '
              name = name.gsub(' ','_')
            end
            
            #fixes problem of different SHP archive files with different case patterns
            FileUtils.mv("#{tmp_path}", "#{dirname}/#{name.downcase}") unless File.basename(tmp_path) == name.downcase
            name = name.downcase
            if CartoDB::Importer::SUPPORTED_FORMATS.include?(File.extname(name))
              suggested = get_valid_name(File.basename(name,@ext).tr('.','_').downcase.sanitize) if !@force_name
              import_data << {
                :ext => File.extname(name),
                :suggested_name => suggested,
                :path => "#{dirname}/#{name}"
              }
            end    
          end
        end
        
        # construct return variables
        import_data
      end  
    end
  end    
end
