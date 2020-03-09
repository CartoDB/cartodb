require 'typhoeus'

module Carto
  module Http

    #Wraps a typhoeus request and logs it
    class Request

      # Used to avoid blocks to the default Typhoeus User-Agent
      # http://www.ispcolohost.com/2015/08/05/amazon-ec2-ddos-from-typhoeus-user-agent/
      DEFAULT_USER_AGENT = 'Mozilla/5.0 (CartoDB) Gecko/20100101 Firefox/40.0'

      def initialize(logger, url, options = {})
        @logger = logger
        @options = options
        set_user_agent
        @typhoeus_request = Typhoeus::Request.new(url, options)
      end

      def run
        response = @typhoeus_request.run
        @logger.log(response)
        response
      end

      def url
        @typhoeus_request.url
      end

      def options
        @typhoeus_request.options
      end

      def on_headers(&block)
        @typhoeus_request.on_headers(&block)
      end

      def on_body(&block)
        @typhoeus_request.on_body(&block)
      end

      def on_complete(&block)
        @typhoeus_request.on_complete(&block)
      end

      def set_user_agent(user_agent = DEFAULT_USER_AGENT)
        if @options.has_key?(:headers)
          @options[:headers] = @options[:headers].merge({"User-Agent"=>user_agent})
        else
          @options = @options.merge({:headers => {"User-Agent"=>user_agent}})
        end
      end
    end

  end
end
