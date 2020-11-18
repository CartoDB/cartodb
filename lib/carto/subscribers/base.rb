module Carto
  module Subscribers
    class Base

      include ::LoggerHelper

      attr_accessor :notifications_topic

      def initialize(notifications_topic)
        self.notifications_topic = notifications_topic
      end

      private

      def log_context
        super.merge(subscriber_class: self.class.name)
      end

      def log_command_start(method_name, params = {})
        log_info(params.merge(message: 'Processing command', command_name: method_name))
      end

      def log_command_end(method_name, params = {})
        log_info(params.merge(message: 'Completed command', command_name: method_name))
      end

    end
  end
end
