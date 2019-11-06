require_dependency 'carto/storage'

module Carto
  class AssetsService
    def upload(namespace, resource)
      file = fetch_file(resource)
      storage = Storage.instance.for(location)
      begin
        identifier, url = storage.upload(namespace, file)
      ensure
        file.close
        file.unlink
      end

      storage_info = {
        type: storage.class.name.demodulize.downcase,
        location: location,
        identifier: identifier
      }

      [storage_info, url]
    end

    def remove(storage_info)
      Storage.instance
             .for(storage_info[:location], preferred_type: storage_info[:type])
             .remove(storage_info[:identifier])
    end

    def fetch_file(resource)
      raise NotImplementedError.new("This method should be implemented by children classes")
    end

    def location
      raise NotImplementedError.new("This method should be implemented by children classes")
    end

    def max_size_in_bytes
      raise NotImplementedError.new("This method should be implemented by children classes")
    end

    def resource_extension(resource)
      # Resource can be a ActionDispatch::Http::UploadedFile or a URI string
      filename = resource.respond_to?(:original_filename) ? resource.original_filename : resource
      extension = File.extname(filename).downcase

      raise UnprocesableEntityError.new("extension not accepted") unless VALID_EXTENSIONS.include?(extension)
      extension
    end

  end
end
