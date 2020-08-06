require 'socket'
require 'statsd'

module CartoDB
  module Stats

    class Aggregator

      private_class_method :new

      attr_reader :fully_qualified_prefix

      # Always tries to read config and return a real aggregator by default,
      # returning the dummy one if there's no config
      # @param String prefix
      # @param Hash config Graphite config. Leave as empty hash to try to load from CartoDB configuration
      # @param String host_info (Optional) If set to nil, will only use prefix, else is used also as part of the prefix
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
        @prefix = prefix
        set_host_info(host_info)
      end

      def set_host_info(host_info)
        @fully_qualified_prefix = host_info.nil? ? "#{@prefix}" : "#{@prefix}.#{host_info}"
        reset_timing_stack
      end

      def timing(key)
        return_value = nil
        @timing_stack.push(key)
        Statsd.timing(timing_chain) do
          begin
            return_value = yield
          rescue StandardError => e
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

      def decrement(key)
        Statsd.decrement("#{fully_qualified_prefix}.#{key}")
      end

      def update_counter(key, delta)
        Statsd.update_counter("#{fully_qualified_prefix}.#{key}", delta)
      end

      protected

      def self.read_config
        config = Cartodb.config[:graphite]
        config.nil? ? {} : config
      rescue StandardError => exception
        CartoDB.notify_exception(exception)
        {}
      end

      private

      def reset_timing_stack
        @timing_stack = [ @fully_qualified_prefix ]
      end

    end

    class NullAggregator
      # INFO: Provided as catch-all for both general increment/decrement/etc. & specific aggregator convenience methods
      def method_missing(method, *arguments, &block)
        if block
          yield
        end
      end
    end

  end
end
