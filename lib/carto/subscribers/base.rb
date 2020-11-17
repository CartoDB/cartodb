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

      def log_command_start(method_name, overrides = {})
        log_info({ message: 'Processing command', command_name: method_name }.merge(overrides))
      end

      def log_command_end(method_name, overrides = {})
        log_info({ message: 'Completed command', command_name: method_name }.merge(overrides))
      end

    end
  end
end
