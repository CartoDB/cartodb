# encoding: utf-8

require 'json'

require_relative '../util/csv_file_dumper'

require_relative '../../../../twitter-search/twitter-search'
require_relative '../../../../../lib/cartodb/logger'
require_relative '../base_file_stream'

module CartoDB
  module Datasources
    module Search

      # NOTE: 'redis_storage' is only sent in normal imports, not at OAuth or Synchronizations,
      # as this datasource is not intended to be used in such.
      class Twitter < BaseFileStream

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

        USER_LIMITS_FILTER_CREDITS = :twitter_credits_limit

        CATEGORY_NAME_KEY  = :name
        CATEGORY_TERMS_KEY = :terms

        GEO_SEARCH_FILTER = 'has:geo'
        PROFILE_GEO_SEARCH_FILTER = 'has:profile_geo'
        OR_SEARCH_FILTER  = 'OR'

        # Seconds to substract from current time as threshold to consider a time
        # as "now or from the future" upon date filter build
        TIMEZONE_THRESHOLD = 60

        # Gnip's 30 limit minus 'has:geo' one
        MAX_SEARCH_TERMS = 30 - 1

        MAX_QUERY_SIZE = 2048

        MAX_TABLE_NAME_SIZE = 30

        # Constructor
        # @param config Array
        # [
        #  'auth_required'
        #  'username'
        #  'password'
        #  'search_url'
        # ]
        # @param user ::User
        # @param redis_storage Redis|nil (optional)
        # @param user_defined_limits Hash|nil (optional)
        # @throws UninitializedError
        def initialize(config, user, redis_storage = nil, user_defined_limits={})
          @service_name = DATASOURCE_NAME
          @filters = Hash.new

          raise UninitializedError.new('missing user instance', DATASOURCE_NAME) if user.nil?
          raise MissingConfigurationError.new('missing auth_required', DATASOURCE_NAME) unless config.include?('auth_required')
          raise MissingConfigurationError.new('missing username', DATASOURCE_NAME) unless config.include?('username')
          raise MissingConfigurationError.new('missing password', DATASOURCE_NAME) unless config.include?('password')
          raise MissingConfigurationError.new('missing search_url for GNIP API', DATASOURCE_NAME) unless config.include?('search_url')

          @user_defined_limits = user_defined_limits

          @search_api_config = {
            TwitterSearch::SearchAPI::CONFIG_AUTH_REQUIRED              => config['auth_required'],
            TwitterSearch::SearchAPI::CONFIG_AUTH_USERNAME              => config['username'],
            TwitterSearch::SearchAPI::CONFIG_AUTH_PASSWORD              => config['password'],
            TwitterSearch::SearchAPI::CONFIG_SEARCH_URL                 => config['search_url'],
            TwitterSearch::SearchAPI::CONFIG_REDIS_RL_ACTIVE            => config.fetch('ratelimit_active', nil),
            TwitterSearch::SearchAPI::CONFIG_REDIS_RL_MAX_CONCURRENCY   => config.fetch('ratelimit_concurrency', nil),
            TwitterSearch::SearchAPI::CONFIG_REDIS_RL_TTL               => config.fetch('ratelimit_ttl', nil),
            TwitterSearch::SearchAPI::CONFIG_REDIS_RL_WAIT_SECS         => config.fetch('ratelimit_wait_secs', nil)
          }
          @redis_storage = redis_storage

          @csv_dumper = CSVFileDumper.new(TwitterSearch::JSONToCSVConverter.new, DEBUG_FLAG)

          @user = user
          @data_import_item = nil

          @logger = nil
          @used_quota = 0
          @user_semaphore = Mutex.new
        end

        # Factory method
        # @param config {}
        # @param user ::User
        # @param redis_storage Redis|nil
        # @param user_defined_limits Hash|nil
        # @return CartoDB::Datasources::Search::TwitterSearch
        def self.get_new(config, user, redis_storage = nil, user_defined_limits={})
          return new(config, user, redis_storage, user_defined_limits)
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

        # @param id string
        # @param stream Stream
        # @return Integer bytes streamed
        def stream_resource(id, stream)
          unless has_enough_quota?(@user)
            raise OutOfQuotaError.new("#{@user.username} out of quota for tweets", DATASOURCE_NAME)
          end
          raise ServiceDisabledError.new(DATASOURCE_NAME, @user.username) unless is_service_enabled?(@user)

          fields_from(id)

          do_search(@search_api_config, @redis_storage, @filters, stream)
        end

        # Retrieves a resource and returns its contents
        # @param id string Will contain a stringified JSON
        # @return mixed
        # @throws ServiceDisabledError
        # @throws OutOfQuotaError
        # @throws ParameterError
        # @deprecated Use stream_resource instead
        def get_resource(id)
          unless has_enough_quota?(@user)
            raise OutOfQuotaError.new("#{@user.username} out of quota for tweets", DATASOURCE_NAME)
          end
          raise ServiceDisabledError.new(DATASOURCE_NAME, @user.username) unless is_service_enabled?(@user)

          fields_from(id)

          do_search(@search_api_config, @redis_storage, @filters, stream = nil)
        end

        # @param id string
        # @return Hash
        def get_resource_metadata(id)
          fields_from(id)
          {
              id:       id,
              title:    DATASOURCE_NAME,
              url:      nil,
              service:  DATASOURCE_NAME,
              checksum: nil,
              size:     0,
              filename: "#{table_name}.csv"
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
          "<CartoDB::Datasources::Search::Twitter @user=#{@user.username} @filters=#{@filters} @search_api_config=#{search_api_config_public_values}>"
        end

        # If this datasource accepts a data import instance
        # @return Boolean
        def persists_state_via_data_import?
          true
        end

        # Stores the data import item instance to use/manipulate it
        # @param value DataImport
        def data_import_item=(value)
          @data_import_item = value
        end

        def set_audit_to_completed(table_id = nil)
          entry =  audit_entry.class.where(data_import_id:@data_import_item.id).first
          raise DatasourceBaseError.new("Couldn't fetch SearchTweet entry for data import #{@data_import_item.id}", \
                                        DATASOURCE_NAME) if entry.nil?

          entry.set_complete_state
          entry.table_id = table_id unless table_id.nil?
          entry.save
        end

        def set_audit_to_failed
          entry =  audit_entry.class.where(data_import_id:@data_import_item.id).first
          raise DatasourceBaseError.new("Couldn't fetch SearchTweet entry for data import #{@data_import_item.id}", \
                                        DATASOURCE_NAME) if entry.nil?

          entry.set_failed_state
          entry.save
        end

        # @return Hash
        def get_audit_stats
          entry =  audit_entry.class.where(data_import_id:@data_import_item.id).first
          raise DatasourceBaseError.new("Couldn't fetch SearchTweet entry for data import #{@data_import_item.id}", \
                                        DATASOURCE_NAME) if entry.nil?
          { :retrieved_items => entry.retrieved_items }
        end

        private

        # Used at specs
        attr_accessor :search_api_config, :csv_dumper
        attr_reader   :data_import_item

        def search_api_config_public_values
          {
            TwitterSearch::SearchAPI::CONFIG_AUTH_REQUIRED            =>
              @search_api_config[TwitterSearch::SearchAPI::CONFIG_AUTH_REQUIRED],
            TwitterSearch::SearchAPI::CONFIG_AUTH_USERNAME            =>
              @search_api_config[TwitterSearch::SearchAPI::CONFIG_AUTH_USERNAME],
            TwitterSearch::SearchAPI::CONFIG_SEARCH_URL               =>
              @search_api_config[TwitterSearch::SearchAPI::CONFIG_SEARCH_URL]
          }
        end

        # Returns if the user set a maximum credits to use
        # @return Integer
        def twitter_credit_limits
          @user_defined_limits.fetch(USER_LIMITS_FILTER_CREDITS, 0)
        end

        # Wraps check of specified user limit or not (to use instead his max quota)
        # @return Integer
        def remaining_quota
          twitter_credit_limits > 0 ? [@user.remaining_twitter_quota, twitter_credit_limits].min
                                    : @user.remaining_twitter_quota
        end

        def table_name
          terms_fragment = @filters[FILTER_CATEGORIES].map { |category|
            clean_category(category[CATEGORY_TERMS_KEY]).gsub(/[^0-9a-z,]/i, '').gsub(/[,]/i, '_')
          }.join('_').slice(0,MAX_TABLE_NAME_SIZE)

          "twitter_#{terms_fragment}"
        end

        def clean_category(category)
          category.gsub(" (#{GEO_SEARCH_FILTER} OR #{PROFILE_GEO_SEARCH_FILTER})", '')
                  .gsub(" #{OR_SEARCH_FILTER} ", ', ')
                  .gsub(/^\(/, '')
                  .gsub(/\)$/, '')
        end

        def fields_from(id)
          return unless @filters.count == 0

          fields = ::JSON.parse(id, symbolize_names: true)

          @filters[FILTER_CATEGORIES] = build_queries_from_fields(fields)

          if @filters[FILTER_CATEGORIES].size > MAX_CATEGORIES
            raise ParameterError.new("Max allowed categories are #{FILTER_CATEGORIES}", DATASOURCE_NAME)
          end

          @filters[FILTER_FROMDATE] = build_date_from_fields(fields, 'from')
          @filters[FILTER_TODATE] = build_date_from_fields(fields, 'to')
          @filters[FILTER_MAXRESULTS] = build_maxresults_field(@user)
          @filters[FILTER_TOTAL_RESULTS] = build_total_results_field(@user)
        end

        # Signature must be like: .report_message('Import error', 'error', error_info: stacktrace)
        def report_error(message, additional_data)
          log("Error: #{message} Additional Info: #{additional_data}")
          CartoDB::Logger.error(message: message, error_info: additional_data)
        end

        # @param api_config Hash
        # @param redis_storage Mixed
        # @param filters Hash
        # @param stream IO
        # @return Mixed The data
        def do_search(api_config, redis_storage, filters, stream)
          threads = {}
          base_filters = filters.select { |k, v| k != FILTER_CATEGORIES }

          category_totals = {}
          dumper_additional_fields = {}
          filters[FILTER_CATEGORIES].each { |category|
            dumper_additional_fields[category[CATEGORY_NAME_KEY]] = {
              category_name:  category[CATEGORY_NAME_KEY],
              category_terms: clean_category(category[CATEGORY_TERMS_KEY])
            }
            @csv_dumper.begin_dump(category[CATEGORY_NAME_KEY])
          }
          @csv_dumper.additional_fields = dumper_additional_fields

          log("Searching #{filters[FILTER_CATEGORIES].length} categories")

          filters[FILTER_CATEGORIES].each { |category|
            # If all threads are created at the same time, redis semaphore inside search_api
            # might not yet have new value, so introduce a small delay on each thread creation
            sleep(0.1)
            threads[category[CATEGORY_NAME_KEY]] = Thread.new {
              api = TwitterSearch::SearchAPI.new(api_config, redis_storage, @csv_dumper)
              # Dumps happen inside upon each block response
              total_results = search_by_category(api, base_filters, category)
              category_totals[category[CATEGORY_NAME_KEY]] = total_results
            }
          }
          threads.each {|key, thread|
            thread.join
          }

          # INFO: For now we don't treat as error a no results scenario, else use:
          # raise NoResultsError.new if category_totals.values.inject(:+) == 0

          filters[FILTER_CATEGORIES].each { |category|
            @csv_dumper.end_dump(category[CATEGORY_NAME_KEY])
          }
          streamed_size = @csv_dumper.merge_dumps_into_stream(dumper_additional_fields.keys, stream)

          log("Temp files:\n#{@csv_dumper.file_paths}")
          log("#{@csv_dumper.original_file_paths}\n#{@csv_dumper.headers_path}")

          if twitter_credit_limits > 0 || !@user.soft_twitter_datasource_limit
            if (remaining_quota - @used_quota) < 0
              # Make sure we don't charge extra tweets (even if we "lose" charging a block or two of tweets)
              @used_quota = remaining_quota
            end
          end

          # remaining quota is calc. on the fly based on audits/imports
          save_audit(@user, @data_import_item, @used_quota)

          streamed_size
        end

        def search_by_category(api, base_filters, category)
          api.params = base_filters

          exception = nil
          next_results_cursor = nil
          total_results = 0

          begin
            exception = nil
            out_of_quota = false

            @user_semaphore.synchronize {
              # Credit limits must be honoured above soft limit
              if twitter_credit_limits > 0 || !@user.soft_twitter_datasource_limit
                if remaining_quota - @used_quota <= 0
                  out_of_quota = true
                  next_results_cursor = nil
                end
              end
            }

            unless out_of_quota
              api.query_param = category[CATEGORY_TERMS_KEY]
              begin
                results_page = api.fetch_results(next_results_cursor)
              rescue TwitterSearch::TwitterHTTPException => e
                exception = e
                report_error(e.to_s, e.backtrace)
                # Stop gracefully to not break whole import process
                results_page = {
                    results: [],
                    next: nil
                }
              end

              dumped_items_count = @csv_dumper.dump(category[CATEGORY_NAME_KEY], results_page[:results])
              next_results_cursor = results_page[:next].nil? ? nil : results_page[:next]

              @user_semaphore.synchronize {
                @used_quota += dumped_items_count
              }

              total_results += dumped_items_count
            end
          end while (!next_results_cursor.nil? && !out_of_quota && !exception)

          log("'#{category[CATEGORY_NAME_KEY]}' got #{total_results} results")
          log("Got exception at '#{category[CATEGORY_NAME_KEY]}': #{exception.inspect}") if exception

          # If fails on the first request, bubble up the error, else will return as many tweets as possible
          if !exception.nil? && total_results == 0
            log("ERROR: 0 results & exception: #{exception} (HTTP #{exception.http_code}) #{exception.additional_data}")
            # @see http://support.gnip.com/apis/search_api/api_reference.html
            if exception.http_code == 422 && exception.additional_data =~ /request usage cap exceeded/i
              raise OutOfQuotaError.new(exception.to_s, DATASOURCE_NAME)
            end
            if [401, 404].include?(exception.http_code)
              raise MissingConfigurationError.new(exception.to_s, DATASOURCE_NAME)
            end
            if [400, 422].include?(exception.http_code)
              raise InvalidInputDataError.new(exception.to_s, DATASOURCE_NAME)
            end
            if exception.http_code == 429
              raise ResponseError.new(exception.to_s, DATASOURCE_NAME)
            end
            if exception.http_code >= 500 && exception.http_code < 600
              raise GNIPServiceError.new(exception.to_s, DATASOURCE_NAME)
            end
            raise DatasourceBaseError.new(exception.to_s, DATASOURCE_NAME)
          end

          total_results
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
              timezoned_date = Time.gm(year, month, day, fields[:dates][hour_sym], fields[:dates][min_sym])
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
            if category[:terms].count > MAX_SEARCH_TERMS
              category[:terms] = category[:terms].slice(0, MAX_SEARCH_TERMS)
            end

            category[:terms] = sanitize_terms(category[:terms])

            query = {
              CATEGORY_NAME_KEY => category[:category].to_s,
              CATEGORY_TERMS_KEY => ''
            }

            unless category[:terms].count == 0
              query[CATEGORY_TERMS_KEY] << '('
              query[CATEGORY_TERMS_KEY] << category[:terms].join(' OR ')
              query[CATEGORY_TERMS_KEY] << ") (#{GEO_SEARCH_FILTER} OR #{PROFILE_GEO_SEARCH_FILTER})"
            end

            if query[CATEGORY_TERMS_KEY].length > MAX_QUERY_SIZE
              raise ParameterError.new("Obtained search query is bigger than #{MAX_QUERY_SIZE} chars", DATASOURCE_NAME)
            end

            queries << query
          }
          queries
        end

        # @param terms_list Array
        def sanitize_terms(terms_list)
          terms_list.map{ |term|
            # Remove unwanted stuff
            sanitized = term.to_s.gsub(/^ /, '').gsub(/ $/, '').gsub('"', '')
            # Quote if needed
            if sanitized.gsub(/[a-z0-9@#]/i,'') != ''
              sanitized = '"' + sanitized + '"'
            end
            sanitized.length == 0 ? nil : sanitized
          }.compact
        end

        # Max results per page
        # @param user ::User
        def build_maxresults_field(user)
          if twitter_credit_limits > 0
            [remaining_quota, TwitterSearch::SearchAPI::MAX_PAGE_RESULTS].min
          else
            # user about to hit quota?
            if remaining_quota < TwitterSearch::SearchAPI::MAX_PAGE_RESULTS
              if user.soft_twitter_datasource_limit
                # But can go beyond limits
                TwitterSearch::SearchAPI::MAX_PAGE_RESULTS
              else
                remaining_quota
              end
            else
              TwitterSearch::SearchAPI::MAX_PAGE_RESULTS
            end
          end
        end


        # Max total results
        # @param user ::User
        def build_total_results_field(user)
          if twitter_credit_limits == 0 && user.soft_twitter_datasource_limit
            NO_TOTAL_RESULTS
          else
            remaining_quota
          end
        end

        # @param user ::User
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

        # @param user ::User
        # @return boolean
        def has_enough_quota?(user)
          # As this is used to disallow searches (and throw exceptions) don't use here user limits
          user.soft_twitter_datasource_limit || (user.remaining_twitter_quota > 0)
        end

        # @param user ::User
        # @param data_import_item DataImport
        # @param retrieved_items_count Integer
        def save_audit(user, data_import_item, retrieved_items_count)
          entry = audit_entry
          entry.set_importing_state
          entry.user_id = user.id
          entry.data_import_id = data_import_item.id
          entry.service_item_id = data_import_item.service_item_id
          entry.retrieved_items = retrieved_items_count
          entry.save
        end

        # Call this inside specs to override returned class
        # @param override_class SearchTweet|nil (optional)
        # @return SearchTweet
        def audit_entry(override_class = nil)
          if @audit_entry.nil?
            if override_class.nil?
              require_relative '../../../../../app/models/search_tweet'
              @audit_entry = ::SearchTweet.new
            else
              @audit_entry = override_class.new
            end
          end
          @audit_entry
        end
      end
    end
  end
end
