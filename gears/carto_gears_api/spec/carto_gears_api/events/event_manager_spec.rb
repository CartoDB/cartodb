require 'spec_helper'
require 'carto_gears_api/events/event_manager'
require 'carto_gears_api/events/base_event'

describe CartoGearsApi::Events::EventManager do
  class TestEvent < CartoGearsApi::Events::BaseEvent
  end

  class OtherEvent < CartoGearsApi::Events::BaseEvent
  end

  class NotAnEvent
  end

  let(:manager) { CartoGearsApi::Events::EventManager.send(:new) }

  describe '#subscribe' do
    it 'event type must be a subclass of BaseEvent' do
      expect { manager.subscribe(NotAnEvent) {} }.to raise_error ArgumentError
    end

    it 'requires a block' do
      expect { manager.subscribe(TestEvent) }.to raise_error ArgumentError
    end

    it 'subscribe with event and block' do
      expect { manager.subscribe(TestEvent) {} }.not_to raise_error ArgumentError
    end
  end

  describe '#notify' do
    it 'triggers all subscribed events' do
      handler = mock
      handler.should_receive(:do).once
      handler2 = mock
      handler2.should_receive(:do).once

      manager.subscribe(TestEvent) { handler.do }
      manager.subscribe(TestEvent) { handler2.do }
      manager.notify(TestEvent.new)
    end

    it 'should not trigger subscribers to other events' do
      handler = mock
      handler.should_receive(:do).never

      manager.subscribe(TestEvent) { handler.do }
      manager.notify(OtherEvent.new)
    end

    it 'should not trigger unsubscribed handlers' do
      handler = mock
      handler.should_receive(:do).never

      descriptor = manager.subscribe(TestEvent) { handler.do }
      manager.unsubscribe(descriptor)
      manager.notify(TestEvent.new)
    end
  end
end
