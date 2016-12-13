# encoding: utf-8

require 'carto/storage'

module Carto
  class OrganizationAssetFile
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

    attr_reader :resource, :organization, :errors

    def initialize(organization, resource)
      @organization = organization
      @resource = resource
      @errors = Hash.new
    end

    def path
      path_and_url[0]
    end

    def url
      path_and_url[1]
    end

    def type
      storage.class.name.demodulize.downcase
    end

    def path_and_url
      return @path_and_url if @path_and_url

      if valid?
        @path_and_url = storage.upload(organization.id, file)
      else
        [nil, nil]
      end
    end

    def valid?
      file && errors.empty?
    end

    def file
      @file ||= fetch_file
    end

    private

    def storage
      @storage ||= Storage.instance.for(self.class.location)
    end

    def fetch_file
      temp_file = Tempfile.new("org_asset_download_#{Time.now.utc.to_i}")
      max_size_in_bytes = self.class.max_size_in_bytes

      begin
        read = IO.copy_stream(open(resource), temp_file, max_size_in_bytes + 1)

        if read > max_size_in_bytes
          errors[:file] = "too big (> #{max_size_in_bytes})"
        end
      ensure
        temp_file.close
      end

      temp_file
    end
  end
end
