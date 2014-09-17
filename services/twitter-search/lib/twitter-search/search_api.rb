# encoding: utf-8

# @see http://support.gnip.com/apis/search_api/
module CartoDB
  module TwitterSearch
    class SearchAPI

      MIN_PAGE_RESULTS = 10
      MAX_PAGE_RESULTS = 500

      CONFIG_AUTH_REQUIRED = :auth_required
      CONFIG_AUTH_USERNAME = :username
      CONFIG_AUTH_PASSWORD = :password
      CONFIG_SEARCH_URL    = :search_url

      CONFIG_REDIS_RL_ACTIVE          = :ratelimit_active
      CONFIG_REDIS_RL_MAX_CONCURRENCY = :ratelimit_concurrency
      CONFIG_REDIS_RL_TTL             = :ratelimit_ttl
      CONFIG_REDIS_RL_WAIT_SECS       = :ratelimit_wait_secs

      PARAM_QUERY       = :query
      PARAM_FROMDATE    = :fromDate
      PARAM_TODATE      = :toDate
      PARAM_MAXRESULTS  = :maxResults
      PARAM_NEXT_PAGE   = :next

      REDIS_KEY = 'importer:twittersearch:rl'
      # default values
      REDIS_RL_CONCURRENCY = 8
      REDIS_RL_TTL = 4
      REDIS_RL_WAIT_SECS = 0.5

      attr_reader :params

      # @param config Hash
      # @param redis_storage Redis|nil (optional)
      def initialize(config, redis_storage = nil)
        raise TwitterConfigException.new(CONFIG_AUTH_REQUIRED) if config[CONFIG_AUTH_REQUIRED].nil?
        if config[CONFIG_AUTH_REQUIRED]
          raise TwitterConfigException.new(CONFIG_AUTH_USERNAME) if config[CONFIG_AUTH_USERNAME].nil? or config[CONFIG_AUTH_USERNAME].empty?
          raise TwitterConfigException.new(CONFIG_AUTH_PASSWORD) if config[CONFIG_AUTH_PASSWORD].nil? or config[CONFIG_AUTH_PASSWORD].empty?
        end
        raise TwitterConfigException.new(CONFIG_SEARCH_URL) if config[CONFIG_SEARCH_URL].nil? or config[CONFIG_SEARCH_URL].empty?

        @config = config

        # Defaults for ratelimit (not critical if not present)
        @config[CONFIG_REDIS_RL_ACTIVE] = true if config[CONFIG_REDIS_RL_ACTIVE].nil?
        @config[CONFIG_REDIS_RL_MAX_CONCURRENCY] = REDIS_RL_CONCURRENCY if config[CONFIG_REDIS_RL_MAX_CONCURRENCY].nil?
        @config[CONFIG_REDIS_RL_TTL] = REDIS_RL_TTL if config[CONFIG_REDIS_RL_TTL].nil?
        @config[CONFIG_REDIS_RL_WAIT_SECS] = REDIS_RL_WAIT_SECS if config[CONFIG_REDIS_RL_WAIT_SECS].nil?

        @redis = redis_storage

        @config[CONFIG_REDIS_RL_ACTIVE] = false if @redis.nil?

        @more_results_cursor = nil
        @params = {
            PARAM_MAXRESULTS => MIN_PAGE_RESULTS
        }
      end

      # Hide sensitive fields
      def to_s
        "<CartoDB::TwitterSearch::SearchAPI @params=#{@params}>"
      end

      def params=(value)
        @params = value if value.kind_of? Hash
      end

      def query_param=(value)
        @params[PARAM_QUERY] = value unless (value.nil? || value.empty?)
      end

      # @param more_results_cursor String|nil
      # @returns Hash
      # {
      #   next  (optional)
      #   results [
      #   ... ( @see http://support.gnip.com/sources/twitter/data_format.html )
      #   ]
      # }
      def fetch_results(more_results_cursor = nil)
        params = query_payload(more_results_cursor.nil? ? @params \
                                                        : @params.merge({PARAM_NEXT_PAGE => more_results_cursor}))

        if @config[CONFIG_REDIS_RL_ACTIVE]
          key = REDIS_KEY
          rl_value = @redis.keys(key)
          # wait until semaphore open
          while !rl_value.nil? && rl_value.count >= @config[CONFIG_REDIS_RL_MAX_CONCURRENCY] do
            sleep(@config[CONFIG_REDIS_RL_WAIT_SECS])
            rl_value = @redis.keys(key)
          end
          @redis.multi do
            @redis.set(key, 1)  # Value is not important, only number of keys
            @redis.expire(key, @config[CONFIG_REDIS_RL_TTL])
          end
        end

        response = Typhoeus.get(@config[CONFIG_SEARCH_URL], http_options(params))

        raise TwitterHTTPException.new(response.code, response.effective_url, response.body) unless response.code == 200

        ::JSON.parse(response.body, symbolize_names: true) unless response.body.nil?
      end

      private

      def query_payload(params)
        payload = {
            publisher: 'twitter',
            PARAM_QUERY => params[PARAM_QUERY]
        }
        payload[PARAM_FROMDATE] = params[PARAM_FROMDATE] unless params[PARAM_FROMDATE].nil? or params[PARAM_FROMDATE].empty?
        payload[PARAM_TODATE] = params[PARAM_TODATE] unless params[PARAM_TODATE].nil? or params[PARAM_TODATE].empty?
        if !params[PARAM_MAXRESULTS].nil? && params[PARAM_MAXRESULTS].kind_of?(Fixnum) \
           && params[PARAM_MAXRESULTS] >= MIN_PAGE_RESULTS && params[PARAM_MAXRESULTS] <= MAX_PAGE_RESULTS
        payload[PARAM_MAXRESULTS] = params[PARAM_MAXRESULTS]
        end
        payload[PARAM_NEXT_PAGE] = params[PARAM_NEXT_PAGE] unless params[PARAM_NEXT_PAGE].nil? or params[PARAM_NEXT_PAGE].empty?
        payload
      end

      def http_options(params={})
        options = {
          params:           params,
          method:           :get,
          followlocation:   true,
          ssl_verifypeer:   false,
          accept_encoding:  'gzip',
          headers:          { 'Accept-Charset' => 'utf-8' },
          ssl_verifyhost:     0,
          nosignal: true
        }
        if @config[CONFIG_AUTH_REQUIRED]
          # Basic authentication
          options[:userpwd] = "#{@config[CONFIG_AUTH_USERNAME]}:#{@config[CONFIG_AUTH_PASSWORD]}"
        end
        options
      end

    end
  end
end

