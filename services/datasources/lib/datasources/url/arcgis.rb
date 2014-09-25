# encoding: utf-8

require 'typhoeus'
require 'json'

module CartoDB
  module Datasources
    module Url

      class ArcGIS

        # Required for all datasources
        DATASOURCE_NAME = 'arcgis'

        DEBUG_FLAG = true

        # Constructor
        def initialize
          super
          @service_name = DATASOURCE_NAME
        end

        # Factory method
        # @return CartoDB::Datasources::Url::ArcGIS
        def self.get_new
          return new
        end

        # If will provide a url to download the resource, or requires calling get_resource()
        # @return bool
        def providers_download_url?
          false
        end

        # Perform the listing and return results
        # @param filter Array : (Optional) filter to specify which resources to retrieve. Leave empty for all supported.
        # @return [ { :id, :title, :url, :service } ]
        def get_resources_list(filter=[])
          filter
        end

        # Retrieves a resource and returns its contents
        # @param id string
        # @return mixed
        def get_resource(id)
          set_data_from(id)

          {

          }
        end

        # @param id string
        # @return Hash
        def get_resource_metadata(id)
          set_data_from(id)

          # Here store the metadata fields from: "fields":[{"name":"OBJECTID"}]

          {
              id:       id,
              title:    DATASOURCE_NAME,
              url:      nil,
              service:  DATASOURCE_NAME,
              checksum: nil,
              size:     0,
              filename: "TBD"
          }
        end

        # Retrieves current filters. Unused as here there's no get_resources_list
        # @return {}
        def filter
          {}
        end

        # Sets current filters. Unused as here there's no get_resources_list
        # @param filter_data {}
        def filter=(filter_data=[])
          filter_data
        end

        # Hide sensitive fields
        def to_s
          "<CartoDB::Datasources::Url::ArcGIS>"
        end

        private

        def set_data_from(id)

        end

      end
    end
  end
end
