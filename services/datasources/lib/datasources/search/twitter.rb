# encoding: utf-8

require 'typhoeus'
require 'json'

require_relative '../../../../twitter-search/twitter-search'

module CartoDB
  module Datasources
    module Search

      # NOTE: 'redis_storage' is only sent in normal imports, not at OAuth or Synchronizations,
      # as this datasource is not intended to be used in such.
      class Twitter < Base

        # Required for all datasources
        DATASOURCE_NAME = 'twitter_search'

        NO_TOTAL_RESULTS = -1

        MAX_CATEGORIES = 4

        DEBUG_FLAG = false

        # Used for each query page size, not as total
        FILTER_MAXRESULTS     = :maxResults
        FILTER_FROMDATE       = :fromDate
        FILTER_TODATE         = :toDate
        FILTER_CATEGORIES     = :categories
        FILTER_TOTAL_RESULTS  = :totalResults

        CATEGORY_NAME_KEY  = :name
        CATEGORY_TERMS_KEY = :terms

        GEO_SEARCH_FILTER = 'has:geo'
        OR_SEARCH_FILTER  = 'OR'

        # Seconds to substract from current time as threshold to consider a time
        # as "now or from the future" upon date filter build
        TIMEZONE_THRESHOLD = 60

        # TODO: Check no other filters are present
        ALLOWED_FILTERS = [
            # From twitter
            FILTER_MAXRESULTS, FILTER_FROMDATE, FILTER_TODATE,
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
        # @param redis_storage Redis|nil (optional)
        # @throws UninitializedError
        def initialize(config, user, redis_storage = nil)
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
          }, redis_storage, DEBUG_FLAG)

          @json2csv_conversor = TwitterSearch::JSONToCSVConverter.new

          @user = user

          @used_quota = 0
          @user_semaphore = Mutex.new
        end


        # Factory method
        # @param config {}
        # @param user User
        # @param redis_storage Redis|nil
        # @return CartoDB::Datasources::Search::TwitterSearch
        def self.get_new(config, user, redis_storage = nil)
          return new(config, user, redis_storage)
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
        # @param id string Will contain a stringified JSON
        # @return mixed
        # @throws ServiceDisabledError
        # @throws OutOfQuotaError
        # @throws ParameterError
        def get_resource(id)
          fields = ::JSON.parse(id, symbolize_names: true)

          if !is_service_enabled?(@user)
            raise ServiceDisabledError.new("Disabled for this user and/or organization", DATASOURCE_NAME)
          end

          if !has_enough_quota?(@user)
            raise OutOfQuotaError.new("#{@user.username}", DATASOURCE_NAME)
          end

          @filters[FILTER_CATEGORIES] = build_queries_from_fields(fields)

          if @filters[FILTER_CATEGORIES].size > MAX_CATEGORIES
            raise ParameterError.new("Max allowed categories are #{FILTER_CATEGORIES}", DATASOURCE_NAME)
          end

          @filters[FILTER_FROMDATE] = build_date_from_fields(fields, 'from')
          @filters[FILTER_TODATE] = build_date_from_fields(fields, 'to')
          @filters[FILTER_MAXRESULTS] = build_maxresults_field(@user)
          @filters[FILTER_TOTAL_RESULTS] = build_total_results_field(@user)

          do_search(@search_api, @filters)
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
              size:     0,
              filename: "#{DATASOURCE_NAME}_#{@user.username}_#{Time.now.strftime("%Y%m%d%H%M%S")}.csv"
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
          "<CartoDB::Datasources::Search::Twitter @user=#{@user} @filters=#{@filters} @search_api=#{@search_api}>"
        end

        private

        attr_accessor :search_api

        # @param api Cartodb::TwitterSearch::SearchAPI
        # @param filters Hash
        def do_search(api, filters)
          base_filters = filters.select { |k, v| k != FILTER_CATEGORIES }

          category_results = {}
          threads = {}
          semaphore = Mutex.new

          filters[FILTER_CATEGORIES].each { |category|
            # If all threads are created at the same time, redis semaphore inside search_api
            # might not yet have new value, so introduce a small delay on each thread creation
            sleep(0.05)
            threads[category[CATEGORY_NAME_KEY]] = Thread.new {
              results = search_by_category(api, base_filters, category)
              semaphore.synchronize {
                category_results[category[CATEGORY_NAME_KEY]] = results
              }
            }
          }
          threads.each {|key, thread|
            thread.join
          }

          # Values will get overriden later
          additional_fields = {
              category_name: 'cat',
              category_terms: 'term'
          }

          # Need trailing newlines as each process call will "need"
          total_results = @json2csv_conversor.generate_headers(additional_fields) + "\n"

          category_results.each { |key, value|
            additional_fields[:category_name] = key
            filters[FILTER_CATEGORIES].each { |category|
              if category[CATEGORY_NAME_KEY] == key
                additional_fields[:category_terms] = \
                  category[CATEGORY_TERMS_KEY].gsub(" #{GEO_SEARCH_FILTER} #{OR_SEARCH_FILTER} ", ', ')
                                              .gsub(" #{GEO_SEARCH_FILTER}", '')
              end
            }
            total_results = total_results + @json2csv_conversor.process(value, false, additional_fields) + "\n"
          }

          # Remove trailing newline from last category
          total_results.gsub!(/\n$/, '')

          if @used_quota > 0
            if @user.organization.nil?
              @user.twitter_datasource_quota = [@user.twitter_datasource_quota - @used_quota, 0].max
              @user.save
            else
              org = @user.organization
              org.twitter_datasource_quota = [org.twitter_datasource_quota - @used_quota, 0].max
              org.save
            end
            # If has a soft-limit on the quota, will just be kept at 0 remaining
          end

          # TODO: Store SearchTweet entry? if so, need states to not count for charging
          # before has finished importing all ok

          total_results
        end

        # As Ruby is pass-by-value, we can't pass user as by-ref param
        def search_by_category(api, base_filters, category)
          results = []

          api.params = base_filters
          api.query_param = category[CATEGORY_TERMS_KEY]

          next_results_cursor = nil

          begin
            out_of_quota = false

            @user_semaphore.synchronize {
              if (!@user.soft_twitter_datasource_limit && @user.effective_twitter_datasource_quota - @used_quota) <= 0
                out_of_quota = true
                next_results_cursor = nil
              end
            }

            unless out_of_quota
              results_page = api.fetch_results(next_results_cursor)
              results = results + results_page[:results]
              next_results_cursor = results_page[:next].nil? ? nil : results_page[:next]

              @user_semaphore.synchronize {
                @used_quota += results_page[:results].count
              }

              if DEBUG_FLAG
                puts "(#{category[CATEGORY_NAME_KEY]}) #{results_page[:results].count} Total: ##{results.count}"
              end
            end
          end while (!next_results_cursor.nil? && !out_of_quota)

          results
        end

        def build_date_from_fields(fields, date_type)
          raise ParameterError.new('missing dates', DATASOURCE_NAME) \
              if fields[:dates].nil?

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
            # Sent by JS in minutes
            timezone = fields[:dates][:user_timezone].nil? ? 0 : fields[:dates][:user_timezone].to_i
            begin
              year, month, day = fields[:dates][date_sym].split('-')
              timezoned_date = Time.utc(year, month, day, fields[:dates][hour_sym], fields[:dates][min_sym])
            rescue ArgumentError
              raise ParameterError.new('Invalid date format', DATASOURCE_NAME)
            end
            timezoned_date += timezone*60

            # Gnip doesn't allows searches "in the future"
            date = timezoned_date >= (Time.now - TIMEZONE_THRESHOLD).utc ? nil : timezoned_date.strftime("%Y%m%d%H%M")
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

            # Gnip limitation
            if category[:terms].count > 30
              category[:terms] = category[:terms].slice(0, 30)
            end

            query = {
              CATEGORY_NAME_KEY => category[:category],
              CATEGORY_TERMS_KEY => ''
            }

            category[:terms].each_with_index { |term, index|
              if index == 0
                term_fragment = "#{term} #{GEO_SEARCH_FILTER}"
              else
                term_fragment = " #{OR_SEARCH_FILTER} #{term} #{GEO_SEARCH_FILTER}"
              end

              # Gnip limitation
              if (query[CATEGORY_TERMS_KEY].length + term_fragment.length) < 1024
                query[CATEGORY_TERMS_KEY] << term_fragment
              end
            }

            queries << query
          }
          queries
        end

        def build_maxresults_field(user)
          # user about to hit quota?
          if user.twitter_datasource_quota < TwitterSearch::SearchAPI::MAX_PAGE_RESULTS
            if user.soft_twitter_datasource_limit
              # But can go beyond limits
              TwitterSearch::SearchAPI::MAX_PAGE_RESULTS
            else
              user.twitter_datasource_quota
            end
          else
            TwitterSearch::SearchAPI::MAX_PAGE_RESULTS
          end
        end

        def build_total_results_field(user)
          if user.soft_twitter_datasource_limit
            NO_TOTAL_RESULTS
          else
            user.twitter_datasource_quota
          end
        end

        # @param user User
        def is_service_enabled?(user)
          if !user.organization.nil?
            enabled = user.organization.twitter_datasource_enabled
            if enabled
              user.twitter_datasource_enabled
            else
              # If disabled org-wide, disabled for everyone
              false
            end
          else
            user.twitter_datasource_enabled
          end
        end

        # @param user User
        def has_enough_quota?(user)
          user.soft_twitter_datasource_limit || (user.twitter_datasource_quota > 0)
        end
      end
    end
  end
end
