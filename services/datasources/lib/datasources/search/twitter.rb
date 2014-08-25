# encoding: utf-8

require 'typhoeus'
require 'json'

require_relative '../util/csv_file_dumper'

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

        DEBUG_FLAG = true

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
            TwitterSearch::SearchAPI::CONFIG_AUTH_REQUIRED              => config['auth_required'],
            TwitterSearch::SearchAPI::CONFIG_AUTH_USERNAME              => config['username'],
            TwitterSearch::SearchAPI::CONFIG_AUTH_PASSWORD              => config['password'],
            TwitterSearch::SearchAPI::CONFIG_SEARCH_URL                 => config['search_url'],
            TwitterSearch::SearchAPI::CONFIG_REDIS_RL_ACTIVE            => config.fetch('ratelimit_active', nil),
            TwitterSearch::SearchAPI::CONFIG_REDIS_RL_MAX_CONCURRENCY   => config.fetch('ratelimit_concurrency', nil),
            TwitterSearch::SearchAPI::CONFIG_REDIS_RL_TTL               => config.fetch('ratelimit_ttl', nil),
            TwitterSearch::SearchAPI::CONFIG_REDIS_RL_WAIT_SECS         => config.fetch('ratelimit_wait_secs', nil)
          }, redis_storage)

          @json2csv_conversor = TwitterSearch::JSONToCSVConverter.new

          @csv_dumper = CSVFileDumper.new(TwitterSearch::JSONToCSVConverter.new, DEBUG_FLAG)

          @user = user
          @data_import_item = nil

          @used_quota = 0
          @user_semaphore = Mutex.new
          @error_report_component = nil
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

          raise ServiceDisabledError.new("Service disabled", DATASOURCE_NAME) unless is_service_enabled?(@user)

          unless has_enough_quota?(@user)
            raise OutOfQuotaError.new("#{@user.username} out of quota for tweets", DATASOURCE_NAME)
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
              filename: "#{DATASOURCE_NAME}_#{Time.now.strftime("%Y%m%d%H%M%S")}.csv"
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
          #require_relative '../../../../../app/models/search_tweet'
          entry =  audit_entry.class.where(data_import_id:@data_import_item.id).first
          raise DatasourceBaseError.new("Couldn't fetch SearchTweet entry for data import #{@data_import_item.id}", \
                                        DATASOURCE_NAME) if entry.nil?

          entry.set_complete_state
          entry.table_id = table_id unless table_id.nil?
          entry.save
        end

        def set_audit_to_failed
          #require_relative '../../../../../app/models/search_tweet'
          entry =  audit_entry.class.where(data_import_id:@data_import_item.id).first
          raise DatasourceBaseError.new("Couldn't fetch SearchTweet entry for data import #{@data_import_item.id}", \
                                        DATASOURCE_NAME) if entry.nil?

          entry.set_failed_state
          entry.save
        end

        # Sets an error reporting component
        # @param component mixed
        # @throws DatasourceBaseError
        def report_component=(component)
          if component.respond_to?(:report_message)
            @error_report_component = component
          else
            raise DatasourceBaseError.new('Attempted to set invalid report component', DATASOURCE_NAME)
          end
        end

        private

        # Used at specs
        attr_accessor :search_api, :csv_dumper
        attr_reader   :data_import_item

        # Signature must be like: .report_message('Import error', 'error', error_info: stacktrace)
        def report_error(message, additional_data)
          if @error_report_component.nil?
            puts "Error: #{message} Additional Info: #{additional_data}"
          else
            @error_report_component.report_message(message, 'error', error_info: additional_data)
          end
        end

        # @param api Cartodb::TwitterSearch::SearchAPI
        # @param filters Hash
        def do_search(api, filters)
          threads = {}
          base_filters = filters.select { |k, v| k != FILTER_CATEGORIES }

          dumper_additional_fields = {}
          filters[FILTER_CATEGORIES].each { |category|
            dumper_additional_fields[category[CATEGORY_NAME_KEY]] = {
              category_name:  category[CATEGORY_NAME_KEY],
              category_terms: category[CATEGORY_TERMS_KEY]
                                .gsub(" #{GEO_SEARCH_FILTER} #{OR_SEARCH_FILTER} ", ', ')
                                .gsub(" #{GEO_SEARCH_FILTER}", '')
            }
            @csv_dumper.begin_dump(category[CATEGORY_NAME_KEY])
          }
          @csv_dumper.additional_fields = dumper_additional_fields

          filters[FILTER_CATEGORIES].each { |category|
            # If all threads are created at the same time, redis semaphore inside search_api
            # might not yet have new value, so introduce a small delay on each thread creation
            sleep(0.1)
            threads[category[CATEGORY_NAME_KEY]] = Thread.new {
              # Dumps inside upon each block response
              search_by_category(api, base_filters, category, @csv_dumper)
            }
          }
          threads.each {|key, thread|
            thread.join
          }

          filters[FILTER_CATEGORIES].each { |category|
            @csv_dumper.end_dump(category[CATEGORY_NAME_KEY])
          }
          merged_data = @csv_dumper.merge_dumps(dumper_additional_fields.keys)

          if DEBUG_FLAG
            puts "Temp folders with results:\n#{@csv_dumper.file_paths}\n#{@csv_dumper.original_file_paths}"
          end

          # remaining quota is calc. on the fly based on audits/imports
          save_audit(@user, @data_import_item, @used_quota)

          merged_data
        end

        # As Ruby is pass-by-value, we can't pass user as by-ref param
        def search_by_category(api, base_filters, category, csv_dumper=nil)
          api.params = base_filters
          api.query_param = category[CATEGORY_TERMS_KEY]

          next_results_cursor = nil
          total_results = 0

          begin
            out_of_quota = false

            @user_semaphore.synchronize {
              if !@user.soft_twitter_datasource_limit && (@user.remaining_twitter_quota - @used_quota) <= 0
                out_of_quota = true
                next_results_cursor = nil
              end
            }

            unless out_of_quota
              begin
                results_page = api.fetch_results(next_results_cursor)
              rescue TwitterSearch::TwitterHTTPException => e
                report_error(e.to_s, e.backtrace)
                # Stop gracefully to not break whole import process
                results_page = {
                    results: [],
                    next: nil
                }
              end
              dumped_items_count = csv_dumper.dump(category[CATEGORY_NAME_KEY], results_page[:results])
              next_results_cursor = results_page[:next].nil? ? nil : results_page[:next]

              @user_semaphore.synchronize {
                @used_quota += dumped_items_count
              }

              total_results += dumped_items_count

            end
          end while (!next_results_cursor.nil? && !out_of_quota)

          if DEBUG_FLAG
            puts "'#{category[CATEGORY_NAME_KEY]}' got #{total_results} results"
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
            if category[:terms].count > 30
              category[:terms] = category[:terms].slice(0, 30)
            end

            category[:terms] = sanitize_terms(category[:terms])

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

        # @param terms_list Array
        def sanitize_terms(terms_list)
          terms_list.map{ |term|
            sanitized = term.to_s.gsub(/^ /, '').gsub(/ $/, '')
            # Remove unwanted stuff too
            if sanitized.include?(' ')
              sanitized = '"' + sanitized + '"'
            end
            sanitized.length == 0 ? nil : sanitized
          }.compact
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
        # @return boolean
        def has_enough_quota?(user)
          user.soft_twitter_datasource_limit || (user.remaining_twitter_quota > 0)
        end

        # @param user User
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
