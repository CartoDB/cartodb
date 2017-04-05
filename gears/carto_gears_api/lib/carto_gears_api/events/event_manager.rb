require 'singleton'

module CartoGearsApi
  module Events
    class EventManager
      include Singleton

      def initialize
        @event_listeners = {}
      end

      # Add a subscriber to an event type
      # @param [Class] event_type class of the event to subscribe to. Subclass of {BaseEvent}
      # @yield [EventType] block to run when the event is triggered. Will receive an object of +event_type+ class
      # @return a descriptor that can be used to {#unsubscribe} from the event
      # @example
      #   event_manager = CartoGearsApi::Events::EventManager.instance.
      #   event_manager.subscribe(CartoGearsApi::Events::UserCreationEvent) { |e| puts e.user.username }
      def subscribe(event_type, &block)
        raise ArgumentError.new('block is mandatory') unless block
        raise ArgumentError.new('event_type must be a subclass of BaseEvent') unless event_type < BaseEvent
        listeners_for(event_type).append(block)
        [event_type, block]
      end

      # Unsubscribes from an event
      # @param descriptor A descritor returned from {#subscribe}
      def unsubscribe(descriptor)
        listeners_for(descriptor[0]).delete(descriptor[1])
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
