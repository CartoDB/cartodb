require 'json'
require 'addressable/uri'
require_relative '../base_direct_stream'
require_relative '../../../../../lib/carto/http/client'

module CartoDB
  module Datasources
    module Url

      class ArcGIS < BaseDirectStream

        # Required for all datasources
        DATASOURCE_NAME = 'arcgis'

        ARCGIS_API_LIKE_URL_RE = /\/rest\/services/i

        METADATA_URL     = '%s?f=json'
        FEATURE_IDS_URL  = '%s/query?where=1%%3D1&returnIdsOnly=true&f=json'
        FEATURE_DATA_POST_URL = '%s/query'
        LAYERS_URL       = '%s/layers?f=json'

        MINIMUM_SUPPORTED_VERSION = 10.1

        # In seconds, for connecting
        HTTP_CONNECTION_TIMEOUT = 60
        # In seconds, for the full request
        HTTP_TIMEOUT = 120
        # In seconds, for writting to logs
        LOG_TIMEOUT = 120

        # Amount to multiply or divide
        BLOCK_FACTOR = 2
        MIN_BLOCK_SIZE = 1
        # GeoJSON can get too big in memory, or ArcGIS have mem problems, so keep reasonable number
        MAX_BLOCK_SIZE = 100
        # In seconds, use 0 to disable
        BLOCK_SLEEP_TIME = 0

        # Each retry will be after SLEEP_REQUEST_TIME^(current_retries_count). Set to 0 to disable retrying
        MAX_RETRIES = 5
        SLEEP_REQUEST_TIME = 5
        SKIP_FAILED_IDS = false

        # Used to display more data only (for local debugging purposes)
        DEBUG = false

        VECTOR_LAYER_TYPE = 'Feature Layer'.freeze
        OID_FIELD_TYPE    = 'esriFieldTypeOID'.freeze

        attr_reader :metadata

        # Constructor
        # @param user ::User
        def initialize(user)
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

          @user = user

          @url = nil
          @ids_total = 0
          @ids_retrieved = 0
          @block_size = 0
          @current_stream_status = true
          @last_stream_status = true
          @ids = nil
          @log_timer = nil
        end

        # Factory method
        # @param user ::User
        # @return CartoDB::Datasources::Url::ArcGIS
        def self.get_new(user)
          return new(user)
        end

        # @return String
        def to_s
          "<CartoDB::Datasources::Url::ArcGis @url=#{@url} @metadata=#{@metadata} @ids_total=#{@ids_total}" +
          " @ids_retrieved=#{@ids_retrieved} current_block_size=#{block_size(update=false)}>"
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

        def timed_log(s)
          t2 = Time.now
          if ((@log_timer == nil) || ((t2 - @log_timer) > LOG_TIMEOUT))
            append_and_store(s)
            @log_timer = t2
          end
        end

        def build_empty_initial_stream
          {
            geometryType: @metadata[:geometry_type],
            fields: @metadata[:fields],
            features: []
          }.to_json
        end

        # Initial stream, to be used for container creation (table usually)
        # @param id string
        # @return String
        def initial_stream(id)
          sub_id = get_subresource_id(id)
          @url = sanitize_id(id, sub_id)

          @ids = get_ids_list(@url)

          return build_empty_initial_stream if @ids.empty?

          @ids_total = @ids.length

          first_item = get_by_ids(@url, [@ids.slice!(0)], @metadata[:fields])
          @ids_retrieved += 1

          timed_log("Retrieved the first element (Total elements: #{@ids_total})")

          # Start with a pesimistic setup
          @block_size = [MIN_BLOCK_SIZE * BLOCK_FACTOR, MAX_BLOCK_SIZE, @metadata[:max_records_per_query]].min

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
            timed_log("Downloaded a chunk of #{ids_block.length} ids (#{@ids_retrieved + ids_block.length} so far)")
            @current_stream_status = true
            retries = 0
            sleep(BLOCK_SLEEP_TIME) unless BLOCK_SLEEP_TIME == 0
          rescue ExternalServiceError => exception
            if @block_size == MIN_BLOCK_SIZE && retries >= MAX_RETRIES
              if SKIP_FAILED_IDS
                items = []
              else
                append_and_store("Too many download failures. Giving up.")
                raise exception
              end
            else
              timed_log("FAILED to download a chunk of #{ids_block.length} ids (#{@ids_retrieved} ids already downloaded). Retrying...")
              @current_stream_status = false
              # Add back, next pass will get fewer items
              @ids = ids_block + @ids

              if @block_size == MIN_BLOCK_SIZE
                retries += 1
                sleep_time = SLEEP_REQUEST_TIME ** retries
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
        # @throws ServiceDisabledError
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

        # If true, a single resource id might return >1 subresources (each one spawning a table)
        # @param id String
        # @return Bool
        def multi_resource_import_supported?(id)
          is_multiresource?(id)
        end

        private

        def http_client
          @http_client ||= Carto::Http::Client.get('arcgis')
        end

        def append_and_store(str, truncate = true, timestamp = Time.now.utc)
          @logger.append_and_store(str, truncate, timestamp) unless @logger.nil?
        end

        # @param id String
        # @param subresource_id String
        # @return Hash
        # @throws DataDownloadError
        # @throws ResponseError
        # @throws InvalidServiceError
        def get_subresource_metadata(id, subresource_id)
          @url = sanitize_id(id, subresource_id)

          response = http_client.get(METADATA_URL % [@url], http_options)
          validate_response(METADATA_URL % [@url], response)

          # non-rails symbolize keys
          data = ::JSON.parse(response.body).inject({}){|memo,(k,v)| memo[k.to_sym] = v; memo}

          raise ResponseError.new("Invalid layer type: '#{data[:type]}'") if data[:type] != VECTOR_LAYER_TYPE
          raise ResponseError.new("Missing data: 'fields'") if data[:fields].nil?

          if data[:supportedQueryFormats].present?
            supported_formats = data.fetch(:supportedQueryFormats).gsub(' ', '').split(',')
          else
            supported_formats = []
          end

          begin
            @metadata = {
              arcgis_version:             data.fetch(:currentVersion),
              name:                       data.fetch(:name),
              description:                data.fetch(:description, ''),
              type:                       data.fetch(:type),
              geometry_type:              data.fetch(:geometryType),
              copyright:                  data.fetch(:copyrightText, ''),
              fields:                     data.fetch(:fields).try(:map) { |field|
                {
                  name: field['name'],
                  type: field['type']
                }
              },
              max_records_per_query:      data.fetch(:maxRecordCount, 500),
              supported_formats:          supported_formats,
              advanced_queries_supported: data.fetch(:supportsAdvancedQueries, false)
            }
          rescue StandardError => exception
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
            size:     NO_CONTENT_SIZE_PROVIDED,
            filename: filename_from(@metadata[:name])
          }
        end

        # Just detects if id is a full map or a specific layer
        # @param id String
        # @return Bool
        def is_multiresource?(id)
          unless id.rindex('?').nil?
            id = id.slice(0, id.rindex('?'))
          end
          (id =~ /\/([0-9]+\/|[0-9]+)$/).nil?
        end

        def get_subresource_id(id)
          id.match(/([0-9]+\/|[0-9]+)$?/)[0]
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

          unless id.rindex('?').nil?
            id = id.slice(0, id.rindex('?'))
          end
          if is_multiresource?(id) && !sub_id.nil?
            id = (id.end_with?('/') ? id : id + '/') + sub_id
          end

          id
        end

        # @return Array [ { :id, :title} ]
        # @throws DataDownloadError
        # @throws ResponseError
        def get_layers_list(url)
          request_url = LAYERS_URL % [url]
          response = http_client.get(request_url, http_options)
          validate_response(request_url, response)

          begin
            data = ::JSON.parse(response.body).fetch('layers')
          rescue StandardError => exception
            raise ResponseError.new("Missing data: #{exception.to_s} #{request_url} #{exception.backtrace}")
          end

          # We only support vector layers (not raster layers)
          data = data.reject { |layer| layer['type'] != VECTOR_LAYER_TYPE }

          raise ResponseError.new("Empty layers list #{request_url}") if data.length == 0

          begin
            data.collect { |item|
              {
                # Leave prepared all child urls
                id: (url.end_with?('/') ? url : url + '/') + item.fetch('id').to_s,
                title: item.fetch('name')
              }
            }
          rescue StandardError => exception
            raise ResponseError.new("Missing data: #{exception.to_s} #{request_url} #{exception.backtrace}")
          end
        end

        # NOTE: Assumes url is valid
        # NOTE: Returned ids are sorted so they can be chunked into blocks to
        #       be requested by range queries: `(OBJECTID >= ... AND OBJECTID <= ... )`
        # @param url String
        # @return Array
        # @throws DataDownloadError
        # @throws ResponseError
        def get_ids_list(url)
          request_url = FEATURE_IDS_URL % [url]
          response = http_client.get(request_url, http_options)
          validate_response(request_url, response)

          begin
            data = ::JSON.parse(response.body).fetch('objectIds').sort
          rescue StandardError => exception
            raise ResponseError.new("Missing data: #{exception.to_s} #{request_url} #{exception.backtrace}")
          end

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

          oid_field = fields.find { |field| field[:type] == OID_FIELD_TYPE }

          if ids.length == 1
            ids_field = { objectIds: ids.first }
          else
            if oid_field
              # Note that ids is sorted
              ids_field = { where: "#{oid_field[:name]} >=#{ids.first} AND #{oid_field[:name]} <=#{ids.last}" }
            else
              # This could be innefficient with large number of ids, but it is limited to MAX_BLOCK_SIZE
              ids_field = { objectIds: ids.join(',') }
            end
          end

          prepared_fields = fields.map { |field| "#{field[:name]}" }.join(',')

          prepared_url = FEATURE_DATA_POST_URL % [url]
          # @see http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#/Query_Map_Service_Layer/02r3000000p1000000/
          params_data = {
            outFields:  prepared_fields,
            outSR:      4326,
            f:          'json'
          }

          params_data.merge! ids_field

          puts "#{prepared_url} (POST) Params:#{params_data}" if DEBUG
          response = http_client.post(prepared_url, http_options(params_data, :post))

          # Timeout connecting to ArcGIS
          if response.code == 0
            raise ExternalServiceError.new("TIMEOUT: #{prepared_url} : #{response.body} #{self.to_s}")
          end
          if response.code != 200
            raise DataDownloadError.new("ERROR: #{prepared_url} POST " +
                                        "#{params_data} (#{response.code}) : #{response.body} #{self.to_s}")
          end
          if response.code == 400 && !response.return_message.nil? \
              && response.return_message.downcase.include?('operation is not supported')
            raise UnsupportedOperationError.new("#{request_url} (#{response.code}) : #{response.body}") \
          end

          begin
            body = ::JSON.parse(response.body)
          rescue JSON::ParserError
            begin
              # HACK: JSON spec does not cover Infinity
              body = ::JSON.parse(response.body.gsub(':INF,', ':"Infinity",'))
            rescue JSON::ParserError => e
              # We cannot do much about it, log, skip and continue
              append_and_store("get_by_ids: #{e.inspect}")
              append_and_store("get_by_ids: #{prepared_url} (POST) Params: #{params_data}", _truncate=false)
              return []
            end
          end

          # Arcgis error
          raise ExternalServiceError.new("#{prepared_url} : #{response.body}") if body.include?('error')

          begin
            retrieved_items = body.fetch('features')
            return [] if retrieved_items.nil? || retrieved_items.empty?
            retrieved_fields = body.fetch('fields')
            geometry_type = body.fetch('geometryType')
            spatial_reference = body.fetch('spatialReference')
          rescue StandardError => exception
            raise ResponseError.new("Missing data: #{exception.to_s} #{prepared_url} #{exception.backtrace}")
          end
          raise ResponseError.new("'fields' empty or invalid #{prepared_url}") \
            if (retrieved_fields.nil? || retrieved_fields.length == 0)
          raise ResponseError.new("'features' empty or invalid #{prepared_url}") \
            if (retrieved_items.nil? || !retrieved_items.kind_of?(Array))

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
        # We decrement faster (BLOCK_FACTOR ** BLOCK_FACTOR) then we increment on success (BLOCK_FACTOR) to
        # reduce the load of the remote server faster
        def block_size(update=true)
          if update
            if @current_stream_status && (@block_size < MAX_BLOCK_SIZE)
              @block_size = [@block_size * BLOCK_FACTOR, MAX_BLOCK_SIZE].min
            end
            if !@current_stream_status && @block_size > MIN_BLOCK_SIZE
              @block_size = [[(@block_size / (BLOCK_FACTOR ** BLOCK_FACTOR)).floor, MIN_BLOCK_SIZE].max, MAX_BLOCK_SIZE].min
            end
            @block_size = [@block_size, @metadata[:max_records_per_query]].min
          end
          @block_size
        end

        def http_options(params={}, method=:get)
          {
            method:           method,
            params:           method == :get ? params : {},
            body:             method == :post ? params : {},
            followlocation:   true,
            ssl_verifypeer:   false,
            accept_encoding:  'gzip',
            headers:          { 'Accept-Charset' => 'utf-8' },
            ssl_verifyhost:   0,
            nosignal:         true,
            connecttimeout:   HTTP_CONNECTION_TIMEOUT,
            timeout:          HTTP_TIMEOUT
          }
        end

        def filename_from(feature_name)
          feature_name.gsub(/[^\w]/, '_').downcase + '.json'
        end

        def validate_response(request_url, response)
          raise ExternalServiceTimeoutError.new("TIMEOUT: #{request_url} : #{response.return_message}") \
            if response.timed_out? || (response.code.zero? && !response.return_message.nil? \
              && response.return_message.downcase.include?('timeout'))

          raise UnsupportedOperationError.new("#{request_url} (#{response.code}) : #{response.body}") \
            if response.code == 400 && !response.return_message.nil? \
              && response.return_message.downcase.include?('operation is not supported')

          raise DataDownloadError.new("#{request_url} (#{response.code}) : #{response.body}") \
            if response.code != 200
        end
      end
    end

    class URLTooLargeError < StandardError
    end
  end
end
