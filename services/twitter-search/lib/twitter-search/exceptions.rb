module CartoDB
  module TwitterSearch

    # Generic/unmapped errors
    class TwitterException < StandardError; end

    class TwitterHTTPException < TwitterException
      def initialize(http_code, url, additional_data = '')
        super("Error fetching results: #{url} (#{http_code}) #{additional_data}")
        @http_code = http_code
        @additional_data = additional_data
      end

      def http_code
        @http_code
      end

      def additional_data
        @additional_data
      end
    end

    class TwitterConfigException < TwitterException
      def initialize(missing_entry)
        super("Config value missing: #{missing_entry}")
      end
    end

  end
end

