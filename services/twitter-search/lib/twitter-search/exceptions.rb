# encoding: utf-8

module CartoDB
  module TwitterSearch

    # Generic/unmapped errors
    class TwitterException < StandardError; end

    class TwitterHTTPException < TwitterException; end

    class TwitterConfigException < TwitterException
      def initialize(missing_entry)
        super("Config value missing: #{missing_entry}")
      end
    end

  end
end

