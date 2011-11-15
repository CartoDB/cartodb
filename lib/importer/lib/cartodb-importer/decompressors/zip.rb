module CartoDB
  module Import
    class Zipper < CartoDB::Import::Decompressor

      register_decompressor :zip
      register_decompressor :kmz

      def process!
        log "Importing zip file: #{@path}"
         Zip::ZipFile.foreach(@path) do |entry|
           name = entry.name.split('/').last
           next if name =~ /^(\.|\_{2})/
           
           # add to delete queue
           @entries << "/tmp/#{name}"
           
           if CartoDB::Importer::SUPPORTED_FORMATS.include?(File.extname(name))
             @ext            = File.extname(name)
             @suggested_name = get_valid_name(File.basename(name,@ext).tr('.','_').downcase.sanitize) if !@force_name
             @path           = "/tmp/#{name}"
             log "Found original @ext file named #{name} in path #{@path}"
           end           
           FileUtils.rm("/tmp/#{name}") if File.file?("/tmp/#{name}")
           entry.extract("/tmp/#{name}")
         end        
                  
         # construct return variables
         to_import_hash
      end  
    end
  end    
end