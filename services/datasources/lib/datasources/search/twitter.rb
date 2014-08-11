# encoding: utf-8

require 'typhoeus'
require 'json'

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

          @search_api = TwitterSearch::SearchAPI.new({
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
          []
        end

        # Retrieves a resource and returns its contents
        # @param id string
        # @return mixed
        # @throws DataDownloadError
        def get_resource(id)
          fields = ::JSON.parse(id, symbolize_names: true)
          # Sample contents of fields
          <<-DOC
          categories: [
              {
                  category: 'Category 1',
                  terms:    ['uno', 'dos', '@tres', '#cuatro']
              },
              {
                  category: 'Category 2',
                  terms:    ['uno', 'dos', '@tres', '#cuatro']
              }
          ],
          dates: {
              fromDate: '2014-03-03', (year month day)
              fromHour: '13', (24 hours)
              fromMin:  '49',
              toDate:   '2014-03-04',
              toHour:   '11',
              toDate:   '59'
          }
          DOC

          # Will launch one query per category
          # TODO: Threaded perform each query
          query = build_queries_from_fields(fields)


          raise 'TBD'
        end

        # @param id string
        # @return Hash
        def get_resource_metadata(id)
          {
              id:       id,
              title:    DATASOURCE_NAME,
              url:      nil,
              service:  DATASOURCE_NAME,
              checksum: nil,
              size:     0
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
          nil
        end

        # Just return datasource name
        # @return string
        def to_s
          DATASOURCE_NAME
        end

        private

        def build_queries_from_fields(fields)
          raise ParameterError.new('missing categories', DATASOURCE_NAME) \
              if fields[:categories].nil? || fields[:categories].empty?

          queries = []

          fields[:categories].each { |category|
            raise ParameterError.new('missing category', DATASOURCE_NAME) if category[:category].nil?
            raise ParameterError.new('missing terms', DATASOURCE_NAME) if category[:terms].nil?

            queries << {
                category[:category] => category[:terms].join(' has:geo OR ') + (' has:geo')
            }
          }

          queries
        end

      end
    end
  end
end
