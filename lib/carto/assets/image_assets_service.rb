require_dependency 'carto/storage'
require_dependency 'carto/assets/assets_service'
require_relative '../../cartodb/image_metadata'

module Carto
  class ImageAssetsService < AssetsService
    VALID_EXTENSIONS = %w{.jpeg .jpg .gif .png .svg}.freeze

    def fetch_file(resource)
      extension = resource_extension(resource)
      temp_file = Tempfile.new(["asset_download_#{Time.now.utc.to_i}", extension])

      begin
        read = IO.copy_stream(open(resource), temp_file, max_size_in_bytes + 1)

        if read > max_size_in_bytes
          message = "resource is too big (> #{max_size_in_bytes} bytes)"
          raise UnprocesableEntityError.new(message)
        end
      ensure
        temp_file.close
      end

      validate_image_file(temp_file, extension)

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

    MAX_IMAGE_SIDE = 1024

    def validate_image_file(file, extension)
      metadata = CartoDB::ImageMetadata.new(file.path, extension: extension)
      if metadata.width > MAX_IMAGE_SIDE || metadata.height > MAX_IMAGE_SIDE
        raise UnprocesableEntityError.new("file is too big, #{MAX_IMAGE_SIDE}x#{MAX_IMAGE_SIDE} max")
      end
    end
  end
end
