require 'singleton'

module CartoGearsApi
  module Events
    class EventManager
      include Singleton

      def initialize
        @event_listeners = {}
      end

      # Add a subscriber to an event type
      # @param [Class] event_type class of the event to subscribe to
      # @yield [EventType] block to run when the event is triggered. Will receive an object of +event_type+ class
      def subscribe(event_type, &block)
        raise ArgumentError.new('block is mandatory') unless block
        raise ArgumentError.new('event_type must be a subclass of BaseEvent') unless event_type.superclass == BaseEvent
        listeners_for(event_type).append(block)
      end

      # @api private
      def notify(event)
        listeners_for(event.class).each do |listener|
          begin
            listener.call(event)
          rescue => exception
            CartoDB::Logger.error(
              message: 'Error while running Gears event listeners',
              exception: exception,
              event: event.class.name
            )
          end
        end
      end

      private

      def listeners_for(event_type)
        @event_listeners[event_type] ||= []
      end
    end
  end
end
