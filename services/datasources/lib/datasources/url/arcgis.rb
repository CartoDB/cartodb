# encoding: utf-8

require 'typhoeus'
require 'json'
require 'addressable/uri'

module CartoDB
  module Datasources
    module Url

      class ArcGIS < BaseDirectStream

        # Required for all datasources
        DATASOURCE_NAME = 'arcgis'

        URL_LIKE_RE            = /(http|https):\/\//
        ARCGIS_API_LIKE_URL_RE = /arcgis\/rest/

        METADATA_URL     = '%s?f=json'
        FEATURE_IDS_URL  = '%s/query?where=1%%3D1&returnIdsOnly=true&f=json'
        FEATURE_DATA_URL = '%s/query?objectIds=%s&outFields=%s&outSR=4326&f=json'

        MINIMUM_SUPPORTED_VERSION = 10.1

        # ~50MB max
        MAX_BLOCK_SIZE = 1024 * 1024 * 50

        attr_reader :metadata

        # Constructor
        def initialize
          super
          @service_name = DATASOURCE_NAME

          # Fields:
          # @metadata = {
          #   arcgis_version:             nil,
          #   name:                       nil,
          #   description:                nil,
          #   type:                       nil,
          #   geometry_type:              nil,
          #   copyright:                  nil,
          #   fields:                     [],
          #   max_records_per_query:      500,
          #   supported_formats:          [],
          #   advanced_queries_supported: false
          # }
          @metadata = nil

          @url = nil

          @ids_total = 0
          @ids_retrieved = 0
          @block_size = 0

          @ids = nil
        end

        # Factory method
        # @return CartoDB::Datasources::Url::ArcGIS
        def self.get_new
          return new
        end

        # @return String
        def to_s
          "<CartoDB::Datasources::Url::ArcGis @url=#{@url} @metadata=#{@metadata} @ids_total=#{@ids_total}" +
          " @ids_retrieved=#{@ids_retrieved} @block_size=#{@block_size}>"
        end

        # If will provide a url to download the resource, or requires calling get_resource()
        # @return Bool
        def providers_download_url?
          false
        end

        # Perform the listing and return results
        # @param filter Array : (Optional) filter to specify which resources to retrieve. Leave empty for all supported.
        # @return [ Hash ]
        def get_resources_list(filter=[])
          filter
        end

        # Retrieves a resource and returns its contents
        # @param id string
        # @return mixed
        def get_resource(id)
          raise 'Not supported by this datasource'
        end

        # Initial stream, to be used for container creation (table usually)
        # @param id string
        # @return String
        def initial_stream(id)
          @url = sanitize_id(id)

          @ids = get_ids_list(@url)
          @ids_total = @ids.length

          first_item = get_by_ids(@url, [@ids.slice!(0)], @metadata[:fields])
          @ids_retrieved += 1
          #@block_size = calculate_block_size(first_item, MAX_BLOCK_SIZE, @metadata[:max_records_per_query])
          # All the algorithm, and the URL gets too big :_(
          @block_size = 200

          ::JSON.dump(first_item)
        end

        # @param id string
        # @return String|nil Nil if no more items
        def stream_resource(id)
          # TODO: Error if @ids nil or @block_size <= 0

          return nil if @ids.empty?

          ids_block = @ids.slice!(0, [@ids.length, @block_size].min)
          items = get_by_ids(@url, ids_block, @metadata[:fields])
          @ids_retrieved += ids_block.length
          puts @ids_retrieved

          ::JSON.dump(items)
        end

        # @param id string
        # @return Hash
        # @throws DataDownloadError
        # @throws ResponseError
        def get_resource_metadata(id)
          @url = sanitize_id(id)

          response = Typhoeus.get(METADATA_URL % [@url], http_options)
          raise DataDownloadError.new("#{METADATA_URL % [@url]} (#{response.code}) : #{response.body}") \
            if response.code != 200

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

        # @param id String
        # @return String
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

        # NOTE: Assumes url is valid
        # @param url String
        # @return Array
        # @throws DataDownloadError
        # @throws ResponseError
        def get_ids_list(url)
          response = Typhoeus.get(FEATURE_IDS_URL % [url], http_options)
          raise DataDownloadError.new("#{FEATURE_IDS_URL % [url]} (#{response.code}) : #{response.body}") \
            if response.code != 200

          begin
            data = ::JSON.parse(response.body).fetch('objectIds')
          rescue => exception
            raise ResponseError.new("Missing data: #{exception}")
          end

          raise ResponseError.new("Empty ids list") if data.length == 0

          data
        end

        # NOTE: Assumes url is valid
        # @param url String
        # @param ids Array
        # @param fields Array
        # @return Array [ Hash ] (non-symbolized keys)
        # @throws InvalidInputDataError
        # @throws DataDownloadError
        def get_by_ids(url, ids, fields)
          raise InvalidInputDataError.new("'ids' empty or invalid") if (ids.nil? || ids.length == 0)
          raise InvalidInputDataError.new("'fields' empty or invalid") if (fields.nil? || fields.length == 0)

          # Doesn't encodes properly even using an external gem, good job Ruby!
          prepared_ids    = Addressable::URI.encode(ids.map { |id| "#{id}" }.join(',')).gsub(',','%2C')
          prepared_fields = Addressable::URI.encode(fields.map { |field| "#{field[:name]}" }.join(',')).gsub(',','%2C')
          prepared_url = FEATURE_DATA_URL % [url, prepared_ids, prepared_fields]

          response = Typhoeus.get(prepared_url, http_options)
          raise DataDownloadError.new("#{prepared_url} (#{response.code}) : #{response.body}") \
            if response.code != 200

          begin
            body = ::JSON.parse(response.body)
            retrieved_fields = body.fetch('fields')
            geometry_type = body.fetch('geometryType')
            spatial_reference = body.fetch('spatialReference')
            retrieved_items = body.fetch('features')
          rescue => exception
            raise ResponseError.new("Missing data: #{exception}")
          end
          raise ResponseError.new("'fields' empty or invalid") if (retrieved_fields.nil? || retrieved_fields.length == 0)
          raise ResponseError.new("'features' empty or invalid") if (retrieved_items.nil? || retrieved_items.length == 0)

          # Fields can be optional, cannot be enforced to always be present
          desired_fields = fields.map { |field| field[:name] }

          {
            geometryType:     geometry_type,
            spatialReference: spatial_reference,
            fields:           retrieved_fields,
            features:         retrieved_items.collect { |item|
              {
                'attributes' => item['attributes'].select{ |k, v| desired_fields.include?(k) },
                'geometry' => item['geometry']
              }
            }
          }
        end

        # @param sample_item Hash
        # @param max_size Integer
        # @param metadata_query_size Integer
        # @return Integer
        def calculate_block_size(sample_item, max_size, metadata_query_size)
          [ [(max_size.to_f / ::JSON.dump(sample_item).length.to_f).floor, 1].max, metadata_query_size].min
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
          feature_name.gsub(/[^\w]/, '_').downcase + '.json'
        end

      end
    end
  end
end
