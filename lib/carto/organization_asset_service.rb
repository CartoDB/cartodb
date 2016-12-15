# encoding: utf-8

require 'carto/storage'
require 'singleton'

module Carto
  class OrganizationAssetService
    include Singleton

    def upload(organization_id, resource)
      file = fetch_file(resource)
      storage = Storage.instance.for(location)
      identifier, url = storage.upload(organization_id, file)

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
             .remove(storage_info[:location])
    end

    def fetch_file(resource)
      temp_file = Tempfile.new("org_asset_download_#{Time.now.utc.to_i}")

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

    DEFAULT_LOCATION = 'organization_assets'.freeze

    def location
      @location ||= Cartodb.get_config_if_present(:assets, 'organization', 'bucket') ||
                    Cartodb.get_config_if_present(:assets, 'organization', 'location') ||
                    DEFAULT_LOCATION
    end

    DEFAULT_MAX_SIZE_IN_BYTES = 1_048_576 # 1 MB

    def max_size_in_bytes
      return @max_size_in_bytes if @max_size_in_bytes

      configured = Cartodb.get_config_if_present(:assets,
                                                 'organizations',
                                                 'max_size_in_bytes')

      @max_size_in_bytes = configured || DEFAULT_MAX_SIZE_IN_BYTES
    end
  end
end
