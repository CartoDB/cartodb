# encoding: utf-8

require 'typhoeus'

require_relative '../../../../twitter-search/twitter-search'

include CartoDB

module CartoDB
  module Datasources
    module Search
      class Twitter < Base

        # Required for all datasources
        DATASOURCE_NAME = 'twitter_search'

        NO_MAX_RESULTS = -1

        ALLOWED_FILTERS = [
            # From twitter
            'query', 'maxResults', 'fromDate', 'toDate',
            # Internal
            'term1', 'term2', 'term3', 'term4', 'max_results'
        ]

        # Constructor
        # @param config Array
        # [
        #  'auth_required'
        #  'username'
        #  'password'
        #  'search_url'
        # ]
        # @param user User
        # @throws UninitializedError
        def initialize(config, user)
          @service_name = DATASOURCE_NAME
          @filters = Hash.new

          raise UninitializedError.new('missing user instance', DATASOURCE_NAME) if user.nil?
          raise MissingConfigurationError.new('missing auth_required', DATASOURCE_NAME) unless config.include?('auth_required')
          raise MissingConfigurationError.new('missing username', DATASOURCE_NAME) unless config.include?('username')
          raise MissingConfigurationError.new('missing password', DATASOURCE_NAME) unless config.include?('password')
          raise MissingConfigurationError.new('missing search_url', DATASOURCE_NAME) unless config.include?('search_url')

          search_api = TwitterSearch::SearchAPI.new({
            TwitterSearch::SearchAPI::CONFIG_AUTH_REQUIRED  => config['auth_required'],
            TwitterSearch::SearchAPI::CONFIG_AUTH_USERNAME  => config['username'],
            TwitterSearch::SearchAPI::CONFIG_AUTH_PASSWORD  => config['password'],
            TwitterSearch::SearchAPI::CONFIG_SEARCH_URL     => config['search_url'],
          })

          @user = user
        end

        # Factory method
        # @param config {}
        # @return CartoDB::Datasources::Search::TwitterSearch
        def self.get_new(config={}, user)
          return new(config, user)
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
          nil
        end

        # Retrieves a resource and returns its contents
        # @param id string
        # @return mixed
        # @throws DataDownloadError
        def get_resource(id)
          raise 'TBD'
        end

        # @param id string
        # @return Hash
        def get_resource_metadata(id)
          raise 'TBD'

          #fetch_headers(id)
          #{
          #    id:       id,
          #    title:    id,
          #    url:      id,
          #    service:  DATASOURCE_NAME,
          #    checksum: checksum_of(id, etag_header, last_modified_header),
          #    size:     0
          #    # No need to use :filename nor file
          #}
        end

        # Retrieves current filters
        # @return {}
        def filter
          @filters
        end

        # Sets current filters
        # @param filter_data {}
        def filter=(filter_data=[])
          filter_data.each { |k, v|
            if ALLOWED_FILTERS.include? k

            end
          }

          raise 'TBD'
        end

        # Just return datasource name
        # @return string
        def to_s
          DATASOURCE_NAME
        end

        private

        # Calculates a checksum of given url
        # @return string
        def checksum_of(url, etag, last_modified)
          # TODO: Use filters here as basis for checksumming


          #noinspection RubyArgCount
          Zlib::crc32(url + etag + last_modified).to_s
        end

        # HTTP (Typhoeus) options
        def http_options
          {
              followlocation: true,
              ssl_verifypeer: false,
              ssl_verifyhost: 0
          }
        end

      end
    end
  end
end
