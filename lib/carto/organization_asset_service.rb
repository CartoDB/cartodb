# encoding: utf-8

require 'carto/storage'
require 'carto/asset_service'
require 'singleton'

module Carto
  class OrganizationAssetService < AssetService
    def upload(organization, resource)
      super(organization.id, resource)
    end

    DEFAULT_LOCATION = 'organization_assets'.freeze

    def location
      @location ||= DEFAULT_LOCATION
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
