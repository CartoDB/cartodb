# encoding: utf-8

require 'carto/storage'
require 'carto/assets/assets_service'
require 'singleton'

module Carto
  class VisualizationAssetsService < AssetsService
    include Singleton

    EXTENSION = ".html".freeze

    def upload(visualization, resource)
      super(visualization.id, resource)
    end

    def fetch_file(resource)
      temp_file = Tempfile.new(["viz_asset_download_#{Time.now.utc.to_i}", EXTENSION])

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

    DEFAULT_LOCATION = 'visualization_assets'.freeze

    def location
      @location ||= Cartodb.get_config(:assets, 'visualization', 'bucket') ||
                    Cartodb.get_config(:assets, 'visualization', 'location') ||
                    DEFAULT_LOCATION
    end

    def max_size_in_bytes
      return @max_size_in_bytes if @max_size_in_bytes

      configured = Cartodb.get_config(:assets, 'visualization', 'max_size_in_bytes')

      @max_size_in_bytes = configured || super
    end
  end
end
