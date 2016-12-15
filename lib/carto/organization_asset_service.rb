# encoding: utf-8

require 'carto/storage'

module Carto
  class OrganizationAssetService
    DEFAULT_LOCATION = 'organization_assets'.freeze

    def self.location
      Cartodb.get_config_if_present(:assets, 'organization', 'bucket') ||
        Cartodb.get_config_if_present(:assets, 'organization', 'location') ||
        DEFAULT_LOCATION
    end

    DEFAULT_MAX_SIZE_IN_BYTES = 1_048_576 # 1 MB

    def self.max_size_in_bytes
      Cartodb.get_config_if_present(:assets, 'organizations', 'max_size_in_bytes') ||
        DEFAULT_MAX_SIZE_IN_BYTES
    end

    def initialize(organization)
      @organization = organization
    end

    def upload(resource)
      file = fetch_file(resource)
      storage = Storage.instance.for(self.class.location)
      identifier, url = storage.upload(@organization.id, file)

      storage_info = {
        type: storage.class.name.demodulize.downcase,
        location: self.class.location,
        identifier: identifier
      }

      [storage_info, url]
    end

    def remove(storage_info)
      Storage.instance
             .for(storage_info[:location], preferred_type: storage_info[:type])
             .remove(storage_info[:location])
    end

    private

    def fetch_file(resource)
      temp_file = Tempfile.new("org_asset_download_#{Time.now.utc.to_i}")
      max_size_in_bytes = self.class.max_size_in_bytes

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
  end
end
