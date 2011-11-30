module CartoDB
  module Import
    class Zipper < CartoDB::Import::Decompressor

      register_decompressor :zip
      register_decompressor :kmz

      def process!
        log "Importing zip file: #{@path}"

        # generate a temp file for import
        tmp_dir = temporary_filename

        Zip::ZipFile.foreach(@path) do |entry|
          name = entry.name.split('/').last
          next if name =~ /^(\.|\_{2})/
          
          # temporary filename. no collisions. 
          tmp_path = "#{tmp_dir}.#{name}"
          
          # add to delete queue
          @entries << tmp_path
          
          if CartoDB::Importer::SUPPORTED_FORMATS.include?(File.extname(name).downcase)
            @ext            = File.extname(name)
            @suggested_name = get_valid_name(File.basename(name,@ext).tr('.','_').downcase.sanitize) if !@force_name
            @path           = tmp_path
            log "Found original @ext file named #{name} in path #{@path}"
          end           
          
          # extract
          entry.extract(tmp_path)
        end        

        # construct return variables
        to_import_hash
      end  
    end
  end    
end