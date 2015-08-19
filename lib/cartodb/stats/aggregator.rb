require 'statsd'

module CartoDB
  module Stats

    class Aggregator

      private_class_method :new

      attr_reader :fully_qualified_prefix

      # Always tries to read config and return a real aggregator by default, 
      # returning the dummy one if there's no config
      def self.instance(prefix, config={}, host_info = Socket.gethostname)
        config = read_config if config.empty?

        if config['host'].nil? || config['port'].nil?
          NullAggregator.new
        else
          Statsd.host = config['host']
          Statsd.port = config['port']
          return new(prefix, host_info)
        end
      end

      def initialize(prefix, host_info)
        @fully_qualified_prefix = "#{prefix}.#{host_info}"
        @timing_stack = [fully_qualified_prefix]
      end

      def timing(key)
        return_value = nil
        @timing_stack.push(key)
        Statsd.timing(timing_chain) do
          begin
            return_value = yield
          rescue => e
            @timing_stack.pop
            raise e
          end
        end
        @timing_stack.pop
        return_value
      end

      def timing_chain
        @timing_stack.join('.')
      end

      def gauge(key, value)
        Statsd.gauge("#{fully_qualified_prefix}.#{key}", value)
      end

      def increment(key)
        Statsd.increment("#{fully_qualified_prefix}.#{key}")
      end

      protected

      def self.read_config
        config = Cartodb.config[:graphite]
        config.nil? ? {} : config
      end

    end

    class NullAggregator

      def timing(key)
        yield
      end

      def gauge(key, value)
      end

      def increment(key)
      end

      # INFO: Provided as catch-all for specific aggregator convenience methods
      # @see CartoDB::Stats::Authentication increment_login_counter() as an example
      def method_missing(method, *arguments, &block)
      end

    end

  end
end
