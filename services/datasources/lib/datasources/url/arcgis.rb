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

        ARCGIS_API_LIKE_URL_RE = /arcgis\/rest/i

        METADATA_URL     = '%s?f=json'
        FEATURE_IDS_URL  = '%s/query?where=1%%3D1&returnIdsOnly=true&f=json'
        FEATURE_DATA_URL = '%s/query?objectIds=%s&outFields=%s&outSR=4326&f=json'
        LAYERS_URL       = '%s/layers?f=json'

        MINIMUM_SUPPORTED_VERSION = 10.1

        # In seconds and for the full request
        HTTP_TIMEOUT = 90

        # Amount to multiply or divide
        BLOCK_FACTOR = 2
        MIN_BLOCK_SIZE = 1
        # Lots of ids can generate too long urls. This size, with a dozen fields fits up to 6 digit ids
        # @see http://www.iis.net/configreference/system.webserver/security/requestfiltering/requestlimits
        MAX_BLOCK_SIZE = 175

        # Each retry will be after SLEEP_REQUEST_TIME^(current_retries_count+1)
        MAX_RETRIES = 1
        SLEEP_REQUEST_TIME = 3
        SKIP_FAILED_IDS = true

        # Used to display more data only (for local debugging purposes)
        DEBUG = false

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
          @current_stream_status = true
          @last_stream_status = true
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
          " @ids_retrieved=#{@ids_retrieved} current_block_size=#{block_size(update=false)}" +
          " @requests_count=#{@requests_count}>"
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
          sub_id = get_subresource_id(id)
          @url = sanitize_id(id, sub_id)

          @ids = get_ids_list(@url)

          @ids_total = @ids.length

          first_item = get_by_ids(@url, [@ids.slice!(0)], @metadata[:fields])
          @ids_retrieved += 1

          # Start optimistic
          @block_size = [MAX_BLOCK_SIZE, @metadata[:max_records_per_query]].min

          ::JSON.dump(first_item)
        end

        # @param id string
        # @return String|nil Nil if no more items
        def stream_resource(id)
          return nil if @ids.empty?

          retries = 0
          begin
            ids_block = @ids.slice!(0, [@ids.length, block_size].min)

            puts "#{@ids_retrieved}/#{@ids_total} (#{ids_block.length})" if DEBUG

            items = get_by_ids(@url, ids_block, @metadata[:fields])
            @last_stream_status = @current_stream_status
            @current_stream_status = true
            retries = 0
          rescue ExternalServiceError => exception
            if @block_size == MIN_BLOCK_SIZE && retries >= MAX_RETRIES
              if SKIP_FAILED_IDS
                items = []
              else
                raise exception
              end
            else
              @last_stream_status = @current_stream_status
              @current_stream_status = false
              # Add back, next pass will get fewer items
              @ids = ids_block + @ids

              if @block_size == MIN_BLOCK_SIZE
                retries += 1
                sleep_time = SLEEP_REQUEST_TIME ** (retries+1)
                puts "Retry delay (#{sleep_time}s)" if DEBUG
                sleep(sleep_time)
              end

              retry
            end
          end

          @ids_retrieved += ids_block.length

          items.length > 0 ? ::JSON.dump(items) : ''
        end

        # @param id string
        # @return Hash
        # @throws DataDownloadError
        # @throws ResponseError
        # @throws InvalidServiceError
        def get_resource_metadata(id)
          if is_multiresource?(id)
            @url = sanitize_id(id)
            {
              # Store original id, not the sanitized one
              id:           id,
              subresources: get_layers_list(@url)
            }
          else
            sub_id = get_subresource_id(id)
            get_subresource_metadata(id, sub_id)
          end
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

        # If true, a single resource id might return >1 subresources (each one spawning a table)
        # @param id String
        # @return Bool
        def multi_resource_import_supported?(id)
          is_multiresource?(id)
        end

        private

        # @param id String
        # @param subresource_id String
        # @return Hash
        # @throws DataDownloadError
        # @throws ResponseError
        # @throws InvalidServiceError
        def get_subresource_metadata(id, subresource_id)
          @url = sanitize_id(id, subresource_id)

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
            raise ResponseError.new("Missing data: #{exception.to_s} #{exception.backtrace}")
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

        # Just detects if id is a full map or a specific layer
        # @param id String
        # @return Bool
        def is_multiresource?(id)
          (id =~ /([0-9])+$/).nil?
        end

        def get_subresource_id(id)
          id.match(/([0-9])+$/)[0]
        end

        # @param id String
        # @param sub_id String|nil
        # @return String
        # @throws InvalidInputDataError
        def sanitize_id(id, sub_id=nil)
          # http://<host>/<site>/rest/services/<folder>/<serviceName>/<serviceType>/
          # <site> is almost always "arcgis" (according to official doc)
          unless id =~ ARCGIS_API_LIKE_URL_RE
            raise InvalidInputDataError.new("Url doesn't looks as from ArcGIS server")
          end

          if is_multiresource?(id)
            if sub_id.nil?
              id = id.slice(0, id.rindex('/') + 1)
            else
              id = id + sub_id
            end
          end

          id
        end

        # @return Array [ { :id, :title} ]
        # @throws DataDownloadError
        # @throws ResponseError
        def get_layers_list(url)
          response = Typhoeus.get(LAYERS_URL % [url], http_options)
          raise DataDownloadError.new("#{FEATURE_IDS_URL % [url]} (#{response.code}) : #{response.body}") \
            if response.code != 200

          begin
            data = ::JSON.parse(response.body).fetch('layers')
          rescue => exception
            raise ResponseError.new("Missing data: #{exception.to_s} #{exception.backtrace}")
          end

          raise ResponseError.new("Empty layers list") if data.length == 0

          begin
            data.collect { |item|
              {
                # Leave prepared all child urls
                id: url + item.fetch('id').to_s,
                title: item.fetch('name')
              }
            }
          rescue => exception
            raise ResponseError.new("Missing data: #{exception.to_s} #{exception.backtrace}")
          end
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
            raise ResponseError.new("Missing data: #{exception.to_s} #{exception.backtrace}")
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
        # @throws ExternalServiceError
        def get_by_ids(url, ids, fields)
          raise InvalidInputDataError.new("'ids' empty or invalid") if (ids.nil? || ids.length == 0)
          raise InvalidInputDataError.new("'fields' empty or invalid") if (fields.nil? || fields.length == 0)

          # Doesn't encodes properly even using an external gem, good job Ruby!
          prepared_ids    = Addressable::URI.encode(ids.map { |id| "#{id}" }.join(',')).gsub(',','%2C')
          prepared_fields = Addressable::URI.encode(fields.map { |field| "#{field[:name]}" }.join(',')).gsub(',','%2C')

          prepared_url = FEATURE_DATA_URL % [url, prepared_ids, prepared_fields]

          puts "#{prepared_url}" if DEBUG

          response = Typhoeus.get(prepared_url, http_options)

          # Timeout connecting to ArcGIS
          if response.code == 0
            raise ExternalServiceError.new("TIMEOUT: #{prepared_url} : #{response.body} #{self.to_s}")
          end
          if response.code != 200
            raise DataDownloadError.new("ERROR: #{prepared_url} (#{response.code}) : #{response.body} #{self.to_s}")
          end

          begin
            body = ::JSON.parse(response.body)
            success = true
          rescue JSON::ParserError
            success = false
          end

          unless success
            begin
              # HACK: JSON spec does not cover Infinity
              body = ::JSON.parse(response.body.gsub(':INF,', ':"Infinity",'))
            rescue JSON::ParserError
              raise ResponseError.new("JSON parsing error. URL: #{prepared_url} #{to_s}")
            end
          end

          # Arcgis error
          raise ExternalServiceError.new("#{prepared_url} : #{response.body}") if body.include?('error')

          begin
            retrieved_fields = body.fetch('fields')
            geometry_type = body.fetch('geometryType')
            spatial_reference = body.fetch('spatialReference')
            retrieved_items = body.fetch('features')
          rescue => exception
            raise ResponseError.new("Missing data: #{exception.to_s} #{exception.backtrace}")
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

        # By default, will update the block size, incrementing or decrementing it according to stream operation results
        # Block size only gets incremented after 2 successful streams to avoid scenario of:
        # X items -> FAIL
        # X/2 items -> PASS
        # X items -> FAIL (again, because erroring item was at second half of X)
        def block_size(update=true)
          if update
            if @current_stream_status && @last_stream_status && @block_size < MAX_BLOCK_SIZE
              @block_size = [@block_size * BLOCK_FACTOR, MAX_BLOCK_SIZE].min
            end
            if !@current_stream_status && @block_size > MIN_BLOCK_SIZE
              @block_size = [[(@block_size / BLOCK_FACTOR).floor, 1].max, MAX_BLOCK_SIZE].min
            end
            @block_size = [@block_size, @metadata[:max_records_per_query]].min
          end
          @block_size
        end

        def http_options(params={})
          {
            params:           params,
            method:           :get,
            followlocation:   true,
            ssl_verifypeer:   false,
            accept_encoding:  'gzip',
            headers:          { 'Accept-Charset' => 'utf-8' },
            ssl_verifyhost:   0,
            nosignal:         true,
            timeout:          HTTP_TIMEOUT
          }
        end

        def filename_from(feature_name)
          feature_name.gsub(/[^\w]/, '_').downcase + '.json'
        end

      end
    end

    class URLTooLargeError < StandardError
    end
  end
end
