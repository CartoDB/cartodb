# encoding: utf-8

module CartoDB
  module TwitterSearch
    class SearchAPI

      CONFIG_AUTH_REQUIRED = :auth_required
      CONFIG_AUTH_USERNAME = :username
      CONFIG_AUTH_PASSWORD = :password
      CONFIG_SEARCH_URL    = :search_url

      PARAM_QUERY       = :query
      PARAM_FROMDATE    = :fromDate
      PARAM_TODATE      = :toDate
      PARAM_MAXRESULTS  = :maxResults
      PARAM_NEXT_PAGE   = :next

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
            PARAM_MAXRESULTS => 10
        }
      end

      def params=(value)
        @params = value if value.kind_of? Hash
      end

      def fetch_results(more_results_cursor = nil)
        params = query_payload(@params)

        response_data = Typhoeus.get(@config[CONFIG_SEARCH_URL], http_options(params))
      end

      private

      def query_payload(params, more_results_cursor = nil)
        payload = {
            publisher: 'twitter',
            PARAM_QUERY => params[PARAM_QUERY]
        }
        payload[PARAM_FROMDATE] = params[PARAM_FROMDATE] unless params[PARAM_FROMDATE].nil? or params[PARAM_FROMDATE].empty?
        payload[PARAM_TODATE] = params[PARAM_TODATE] unless params[PARAM_TODATE].nil? or params[PARAM_TODATE].empty?
        payload[PARAM_MAXRESULTS] = params[PARAM_MAXRESULTS] unless params[PARAM_MAXRESULTS].nil? or !params[PARAM_MAXRESULTS].kind_of? Fixnum
        payload[PARAM_NEXT_PAGE] = more_results_cursor unless more_results_cursor.nil?

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

