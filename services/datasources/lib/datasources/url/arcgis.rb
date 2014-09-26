# encoding: utf-8

require 'typhoeus'
require 'json'

module CartoDB
  module Datasources
    module Url

      class ArcGIS < Base

        # Required for all datasources
        DATASOURCE_NAME = 'arcgis'

        URL_LIKE_RE            = /(http|https):\/\//
        ARCGIS_API_LIKE_URL_RE = /arcgis\/rest/

        METADATA_URL     = '%s?f=json'
        FEATURE_IDS_URL  = '%s/query?where=1%3D1&returnIdsOnly=true&f=json'
        FEATURE_DATA_URL = '%s/query?objectIds=%s&outFields=%s&outSR=4326&f=json'

        MINIMUM_SUPPORTED_VERSION = 10.1

        attr_reader :metadata

        # Constructor
        def initialize
          super
          @service_name = DATASOURCE_NAME

          @metadata = {
            arcgis_version:             nil,
            name:                       nil,
            description:                nil,
            type:                       nil,
            geometry_type:              nil,
            copyright:                  nil,
            fields:                     [],
            max_records_per_query:      500,
            supported_formats:          [],
            advanced_queries_supported: false
          }

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
          url = sanitize_id(id)

          # FEATURE_IDS_URL
          # FEATURE_DATA_URL

          {

          }
        end

        # @param id string
        # @return Hash
        # @throws DataDownloadError
        # @throws ResponseError
        def get_resource_metadata(id)
          url = sanitize_id(id)

          # METADATA_URL
          response = Typhoeus.get(METADATA_URL % [url], http_options)
          raise DataDownloadError.new("#{METADATA_URL % [url]} (#{response.code}) : #{response.body}") if response.code != 200

          # non-rails symbolize keys
          data = ::JSON.parse(response.body).inject({}){|memo,(k,v)| memo[k.to_sym] = v; memo}

          raise ResponseError.new("Missing data: 'fields'") if data[:fields].nil?

          begin
            @metadata = {
              arcgis_version:             data.fetch(:currentVersion),
              name:                       data.fetch(:name),
              description:                data.fetch(:description),
              type:                       data.fetch(:type),
              geometry_type:              data.fetch(:geometryType),
              copyright:                  data.fetch(:copyrightText),
              fields:                     data.fetch(:fields).map{ |field|
                                                                    {
                                                                      name: field['name'],
                                                                      type: field['type']
                                                                    }
                                                                  },
              max_records_per_query:      data.fetch(:maxRecordCount, 500),
              supported_formats:          data.fetch(:supportedQueryFormats).gsub(' ', '').split(','),
              advanced_queries_supported: data.fetch(:supportsAdvancedQueries)
            }
          rescue => exception
            raise ResponseError.new("Missing data: #{exception}")
          end

          raise InvalidServiceError.new("Unsupported ArcGIS version #{@metadata[:arcgis_Version]}, must be >= #{MINIMUM_SUPPORTED_VERSION}") \
            if @metadata[:arcgis_version] < MINIMUM_SUPPORTED_VERSION

          # Here store the metadata fields from: "fields":[{"name":"OBJECTID"}]
          {
              id:       id,
              title:    @metadata[:name],
              url:      nil,
              service:  DATASOURCE_NAME,
              checksum: nil,
              size:     0,
              filename: filename_from(@metadata[:name])
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

        # If this datasource accepts a data import instance
        # @return Boolean
        def persists_state_via_data_import?
          false
        end

        # Sets an error reporting component
        # @param component mixed
        def report_component=(component)
          nil
        end

        private

        # @throws InvalidInputDataError
        def sanitize_id(id)
          raise InvalidInputDataError.new("Url doesn't looks as from ArcGIS server") \
            unless id =~ ARCGIS_API_LIKE_URL_RE && id =~ URL_LIKE_RE

          # No query params
          unless id.index('?').nil?
            id = id.split('?').first
          end

          unless (id =~ /([0-9])+$/).nil?
            range_end = id =~ /([0-9])+$/
            id = id.slice(Range.new(0,range_end-1))
          end

          unless id =~ /\/$/
            id += '/'
          end

          unless id =~ /\/MapServer\/$/
            id += 'MapServer/'
          end

          id + '0'
        end

        def http_options(params={})
          {
            params:           params,
            method:           :get,
            followlocation:   true,
            ssl_verifypeer:   false,
            accept_encoding:  'gzip',
            headers:          { 'Accept-Charset' => 'utf-8' },
            ssl_verifyhost:     0,
            nosignal: true
          }
        end

        def filename_from(feature_name)
          feature_name.gsub(/[^\w]/, '_').downcase
        end

      end
    end
  end
end
