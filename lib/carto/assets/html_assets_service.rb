require_dependency 'carto/storage'
require_dependency 'carto/assets/assets_service'
require 'singleton'

module Carto
  class HTMLAssetsService < AssetsService
    include Singleton

    EXTENSION = ".html".freeze
    DEFAULT_MAX_SIZE_IN_BYTES = 10 * 1024 * 1024 # 10MB

    def upload(visualization, resource)
      super(visualization.id, resource)
    end

    def fetch_file(resource)
      temp_file = Tempfile.new(["html_asset_#{Time.now.utc.to_i}", EXTENSION])

      begin
        read = IO.copy_stream(resource, temp_file, max_size_in_bytes + 1)

        if read > max_size_in_bytes
          message = "resource is too big (> #{max_size_in_bytes} bytes)"
          raise UnprocesableEntityError.new(message)
        end
      ensure
        temp_file.close
      end
      temp_file
    end

    def read_source_data(asset)
      if asset.storage_info[:type] == 'local'
        File.open(asset.storage_info[:identifier]).read
      else
        URI.parse(asset.public_url).open.read
      end
    end

    DEFAULT_LOCATION = 'html_assets'.freeze

    def location
      @location ||= Cartodb.get_config(:assets, 'html', 'bucket') ||
                    Cartodb.get_config(:assets, 'html', 'location') ||
                    DEFAULT_LOCATION
    end

    def max_size_in_bytes
      return @max_size_in_bytes if @max_size_in_bytes

      configured = Cartodb.get_config(:assets, 'html', 'max_size_in_bytes')

      @max_size_in_bytes = configured || DEFAULT_MAX_SIZE_IN_BYTES
    end
  end
end
