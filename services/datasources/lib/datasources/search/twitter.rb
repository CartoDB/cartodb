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

        NO_TOTAL_RESULTS = -1

        MAX_CATEGORIES = 4

        FILTER_QUERY          = 'query'
        # Used for each query page size, not as total
        FILTER_MAXRESULTS     = 'maxResults'
        FILTER_FROMDATE       = 'fromDate'
        FILTER_TODATE         = 'toDate'
        FILTER_CATEGORIES     = 'categories'
        FILTER_TOTAL_RESULTS  = 'totalResults'

        CATEGORY_NAME_KEY  = 'name'
        CATEGORY_TERMS_KEY = 'terms'

        ALLOWED_FILTERS = [
            # From twitter
            FILTER_QUERY, FILTER_MAXRESULTS, FILTER_FROMDATE, FILTER_TODATE,
            # Internal
            FILTER_CATEGORIES, FILTER_TOTAL_RESULTS
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

          @json2csv_conversor = TwitterSearch::JSONToCSVConverter.new

          @user = user
        end

        # Hide sensitive fields
        def to_s
          "<CartoDB::Datasources::Search::Twitter @user=#{@user} @filters=#{@filters} @search_api=#{@search_api}>"
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
        # @param id string Will contain a stringified JSON
        # @return mixed
        # @throws DataDownloadError
        def get_resource(id)
          fields = ::JSON.parse(id, symbolize_names: true)

          @filters[FILTER_CATEGORIES] = build_queries_from_fields(fields)

          if @filters[FILTER_CATEGORIES].size > MAX_CATEGORIES
            raise ParameterError.new("Max allowed categories are #{FILTER_CATEGORIES}", DATASOURCE_NAME)
          end

          @filters[FILTER_FROMDATE] = build_date_from_fields(fields, 'from')
          @filters[FILTER_TODATE] = build_date_from_fields(fields, 'to')

          # TODO: Change accordingly if user is about to hit quota
          @filters[FILTER_MAXRESULTS] = TwitterSearch::SearchAPI::MAX_PAGE_RESULTS

          # TODO: Change according to user soft tweets limit
          @filters[FILTER_TOTAL_RESULTS] = NO_TOTAL_RESULTS

          do_search(@search_api, @filters, @user)
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

        attr_accessor :search_api

        # @param api Cartodb::TwitterSearch::SearchAPI
        # @param filters Hash
        # @param user User
        def do_search(api, filters, user)
          # 1 search using api, 1 thread per term (check typhoeus)
          # 2 json2csv
          # 3 manually concat csvs to import just one
          # 4 return data

          total_results = []

          base_filters = filters.select { |k, v| k != FILTER_CATEGORIES }

          category_results = {}
          threads = {}
          filters[FILTER_CATEGORIES].each { |category|
            threads[category[CATEGORY_NAME_KEY]] = Thread.new {
              category_results[category[CATEGORY_NAME_KEY]] = search_by_category(api, base_filters, category, user)
            }
          }
          threads.each {|key, thread|
            thread.join
          }

          category_results.each { |k, v|
            total_results = total_results + v
          }

          #test = @json2csv_conversor.process(total_results)

          total_results
        end

        def search_by_category(api, base_filters, category, user)
          results = []

          api.params = base_filters
          api.query_param = category[CATEGORY_TERMS_KEY]

          next_results_cursor = nil

          begin
            results_page = api.fetch_results(next_results_cursor)

            results = results + results_page[:results]
            next_results_cursor = results_page[:next].nil? ? nil : results_page[:next]
            # TODO: Check quota, etc. and add to condition
          end while !next_results_cursor.nil?

          results
        end

        def convert_category_results_to_csv(data, conversor, category)

        end

        #TODO: Take into account timezones? or will UI inform?
        def build_date_from_fields(fields, date_type)
          raise ParameterError.new('missing dates', DATASOURCE_NAME) \
              if fields[:dates].nil? || fields[:dates].empty?

          case date_type
            when 'from'
              date_sym = :fromDate
              hour_sym = :fromHour
              min_sym  = :fromMin
            when 'to'
              date_sym = :toDate
              hour_sym = :toHour
              min_sym  = :toMin
          else
            raise ParameterError.new("unknown date type #{date_type}", DATASOURCE_NAME)
          end

          if fields[:dates][date_sym].nil? || fields[:dates][hour_sym].nil? || fields[:dates][min_sym].nil?
            date = nil
          else
            # TODO: Sanitize fields
            date = fields[:dates][date_sym].gsub('-','') + fields[:dates][hour_sym] + fields[:dates][min_sym] + '00'
          end

          date
        end

        def build_queries_from_fields(fields)
          raise ParameterError.new('missing categories', DATASOURCE_NAME) \
              if fields[:categories].nil? || fields[:categories].empty?

          queries = []
          fields[:categories].each { |category|
            raise ParameterError.new('missing category', DATASOURCE_NAME) if category[:category].nil?
            raise ParameterError.new('missing terms', DATASOURCE_NAME) if category[:terms].nil?

            queries << {
              CATEGORY_NAME_KEY => category[:category],
              CATEGORY_TERMS_KEY => category[:terms].join(' has:geo OR ') + (' has:geo')
            }
          }
          queries
        end

      end
    end
  end
end
