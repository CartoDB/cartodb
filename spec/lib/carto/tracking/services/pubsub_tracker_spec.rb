require 'spec_helper'
require 'carto/tracking/services/pubsub_tracker'

describe PubSubTracker do

  describe '#initialize' do

    before(:each) do
      Singleton.__init__(PubSubTracker)
    end

    it 'should raise error if creation of new instances is attempted' do
      expect {
        PubSubTracker.new
      }.to raise_error
    end

    it 'should log an error if an exception occurs during Pubsub initialization' do
      Google::Cloud::Pubsub.stubs(:new).raises('Error')
      CartoDB::Logger.expects(:error).with(has_entry(message: 'PubSub: initialization error'))

      PubSubTracker.instance
    end

    it 'should log an error if an exception occurs during topic configuration' do
      @pubsub = Object.new
      @pubsub.stubs(:topic).raises('Error')
      Google::Cloud::Pubsub.stubs(:new).returns(@pubsub)

      CartoDB::Logger.expects(:error).with(has_entry(message: 'PubSub: initialization error'))

      PubSubTracker.instance
    end
  end

  describe '#send_event' do

    before(:each) do
      Singleton.__init__(PubSubTracker)

      @topic = Object.new
      @pubsub = Object.new
      @pubsub.stubs(:topic).returns(@topic)

      Google::Cloud::Pubsub.stubs(:new).returns(@pubsub)
    end

    it 'should succeed if topic exists and all parameters are filled' do
      success_response = Object.new
      success_response.stubs(:succeeded?).returns(true)
      success_response
      @topic.stubs(:publish_async).returns(success_response)

      user_id = 'ff5d41c7-e599-4876-9646-8ba023031287'
      event = 'Created user'

      properties = {
        organization: 'acme',
        event_origin: 'Central',
        creation_time: DateTime.now,
        mrr_plan: 299,
        on_trial: true,
        plan: 'Individual',
        plan_period: 1,
        revenue: 299,
        trial_ends_at: DateTime.now + 300,
        trial_starts_at: DateTime.now,
        user_active_for: 0.00014968342800925926,
        user_created_at: DateTime.now
      }

      result = PubSubTracker.instance.send_event(:metrics, user_id, event, properties)

      expected_attributes = { user_id: user_id }.merge(properties)
      result.should == expected_attributes
    end

    it 'should log error when no event type is sent' do
      CartoDB::Logger.expects(:error).with(message: 'Error: topic  does not exist')

      @topic.stubs(:publish_async)

      PubSubTracker.instance.send_event(nil, 'user_id', 'event_name')
    end

    it 'should log error when unknown event type sent' do
      CartoDB::Logger.expects(:error).with(message: 'Error: topic fake_topic does not exist')

      @topic.stubs(:publish_async)

      PubSubTracker.instance.send_event(:fake_topic, 'user_id', 'event_name')
    end

    it 'should do nothing when no user id sent' do
      CartoDB::Logger.expects(:error).never

      @topic.stubs(:publish_async)

      result = PubSubTracker.instance.send_event(:metrics, '', 'event_name')

      result.should == nil
    end

    it 'should do nothing when not enabled' do
      CartoDB::Logger.expects(:error).never

      PubSubTracker.any_instance.stubs(:enabled?).returns(false)

      result = PubSubTracker.instance.send_event(:metrics, 'user_id', 'disabled')

      result.should == nil
    end

    it 'should log error if publishing did not succeeded' do
      CartoDB::Logger.expects(:error).with(has_entry(message: 'PubSub: error publishing to topic test-topic for event track user'))

      @topic.stubs(:publish_async).yields(nil)

      user_id = 'jane'
      event = 'track user'

      PubSubTracker.instance.send_event(:metrics, user_id, event)
    end
  end

  describe '#graceful_shutdown' do

    before(:each) do
      Singleton.__init__(PubSubTracker)

      @topic = Object.new
      pubsub = Object.new
      pubsub.stubs(:topic).returns(@topic)

      Google::Cloud::Pubsub.stubs(:new).returns(pubsub)

      @async_publisher = Object.new
      PubSubTracker.any_instance.stubs(:stop_publisher)
      @topic.stubs(:async_publisher).returns(@async_publisher)
    end

    it 'should flush messages if publisher not stopped' do
      @async_publisher.stubs(:stopped?).returns(false)
      PubSubTracker.instance.expects(:stop_publisher).once

      PubSubTracker.instance.graceful_shutdown
    end

    it 'should not be flushed if publisher already stopped' do
      @async_publisher.stubs(:stopped?).returns(true)
      PubSubTracker.instance.expects(:stop_publisher).never

      PubSubTracker.instance.graceful_shutdown
    end

    it 'should not be flushed if not enabled' do
      PubSubTracker.any_instance.stubs(:enabled?).returns(false)
      PubSubTracker.instance.expects(:stop_publisher).never

      PubSubTracker.instance.graceful_shutdown
    end

    it 'should log error if an exception occurs' do
      PubSubTracker.any_instance.stubs(:enabled?).returns(true)
      PubSubTracker.instance.stubs(:stop_publisher).raises('Error')

      CartoDB::Logger.expects(:error).once

      PubSubTracker.instance.graceful_shutdown
    end

    it 'should log error if an exception occurs' do
      PubSubTracker.any_instance.stubs(:enabled?).raises('Error')

      CartoDB::Logger.expects(:error).once

      PubSubTracker.instance.graceful_shutdown
    end
  end
end

