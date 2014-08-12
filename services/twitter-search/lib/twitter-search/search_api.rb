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

      PARAM_QUERY       = :query
      PARAM_FROMDATE    = :fromDate
      PARAM_TODATE      = :toDate
      PARAM_MAXRESULTS  = :maxResults
      PARAM_NEXT_PAGE   = :next

      attr_reader :params

      def initialize(config)
        raise TwitterConfigException.new(CONFIG_AUTH_REQUIRED) if config[CONFIG_AUTH_REQUIRED].nil?
        if config[CONFIG_AUTH_REQUIRED]
          raise TwitterConfigException.new(CONFIG_AUTH_USERNAME) if config[CONFIG_AUTH_USERNAME].nil? or config[CONFIG_AUTH_USERNAME].empty?
          raise TwitterConfigException.new(CONFIG_AUTH_PASSWORD) if config[CONFIG_AUTH_PASSWORD].nil? or config[CONFIG_AUTH_PASSWORD].empty?
        end
        raise TwitterConfigException.new(CONFIG_SEARCH_URL) if config[CONFIG_SEARCH_URL].nil? or config[CONFIG_SEARCH_URL].empty?

        @config = config
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
        params = query_payload(more_results_cursor.nil? ? @params : @params.merge({PARAM_NEXT_PAGE => more_results_cursor}))

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
          ssl_verifyhost:   0
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

