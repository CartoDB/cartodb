# encoding: utf-8

require_dependency 'carto/storage'

module Carto
  class AssetsService
    VALID_EXTENSIONS = %w{.jpeg .jpg .gif .png .svg}.freeze

    # resource can be anything accepted by OpenURI#open as a parameter
    def upload(namespace, resource)
      file = fetch_file(resource)
      storage = Storage.instance.for(location)
      identifier, url = storage.upload(namespace, file)

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
      temp_file = Tempfile.new(["asset_download_#{Time.now.utc.to_i}", resource_extension(resource)])

      begin
        read = IO.copy_stream(open(resource), temp_file, max_size_in_bytes + 1)

        if read > max_size_in_bytes
          message = "resource is too big (> #{max_size_in_bytes} bytes)"
          raise UnprocesableEntityError.new(message)
        end
      ensure
        temp_file.close
      end

      temp_file
    end

    def location
      'assets'
    end

    def max_size_in_bytes
      1_048_576 # 1 MB
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
