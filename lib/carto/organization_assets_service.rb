# encoding: utf-8

require 'carto/storage'
require 'carto/assets_service'
require 'singleton'

module Carto
  class OrganizationAssetsService < AssetsService
    def upload(organization, resource)
      super(organization.id, resource)
    end

    DEFAULT_LOCATION = 'organization_assets'.freeze

    def location
      @location ||= Cartodb.get_config_if_present(:assets, 'organization', 'bucket') ||
                    Cartodb.get_config_if_present(:assets, 'organization', 'location') ||
                    DEFAULT_LOCATION
    end

    def max_size_in_bytes
      return @max_size_in_bytes if @max_size_in_bytes

      configured = Cartodb.get_config_if_present(:assets,
                                                 'organization',
                                                 'max_size_in_bytes')

      @max_size_in_bytes = configured || super
    end
  end
end
