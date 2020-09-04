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
      Rails.logger.expects(:error).with(has_entry(message: 'PubSubTracker: initialization error'))

      PubSubTracker.instance
    end

    it 'should log an error if an exception occurs during topic configuration' do
      @pubsub = Object.new
      @pubsub.stubs(:topic).raises('Error')
      Google::Cloud::Pubsub.stubs(:new).returns(@pubsub)

      Rails.logger.expects(:error).with(has_entry(message: 'PubSubTracker: initialization error'))

      PubSubTracker.instance
    end
  end

  describe '#send_event' do

    before(:each) do
      Singleton.__init__(PubSubTracker)

      @topic_name_and_path = '/projects/project-identifier/topics/topic-name'
      @topic = Object.new
      @topic.stubs(:name).returns(@topic_name_and_path)
      @pubsub = Object.new
      @pubsub.stubs(:topic).returns(@topic)

      Google::Cloud::Pubsub.stubs(:new).returns(@pubsub)
    end

    it 'should succeed if topic exists and all parameters are filled' do
      success_response = Object.new
      success_response.stubs(:succeeded?).returns(true)
      success_response
      @topic.stubs(:publish).returns(success_response)

      user_id = 'ff5d41c7-e599-4876-9646-8ba023031287'
      event = 'map_created'

      properties = {
        user_id: user_id,
        organization: 'acme',
        event_source: 'builder',
        source_domain: '.localhost.lan',
        type: 'table',
        event_time: Time.now.utc,
        plan: 'Individual',
        user_created_at: Time.now
      }

      result = PubSubTracker.instance.send_event(:metrics, user_id, event, properties)

      expected_attributes = { user_id: user_id }.merge(properties)
      result.should == expected_attributes
    end

    it 'should log error when no event type is sent' do
      Rails.logger.expects(:error).with(message: 'PubSubTracker: error topic key  not found')

      @topic.stubs(:publish)

      PubSubTracker.instance.send_event(nil, 'user_id', 'event_name')
    end

    it 'should log error when unknown event type sent' do
      Rails.logger.expects(:error).with(message: 'PubSubTracker: error topic key fake_topic not found')

      @topic.stubs(:publish)

      PubSubTracker.instance.send_event(:fake_topic, 'user_id', 'event_name')
    end

    it 'should do nothing when no user id sent' do
      Rails.logger.expects(:error).never

      @topic.stubs(:publish)

      result = PubSubTracker.instance.send_event(:metrics, '', 'event_name')

      result.should == nil
    end

    it 'should do nothing when not enabled' do
      Rails.logger.expects(:error).never

      PubSubTracker.any_instance.stubs(:enabled?).returns(false)

      result = PubSubTracker.instance.send_event(:metrics, 'user_id', 'disabled')

      result.should == nil
    end

    it 'should log error if publishing did not succeeded' do
      Rails.logger.expects(:error).with(has_entry(message: "PubSubTracker: error publishing to topic #{@topic_name_and_path} for event track user"))

      @topic.stubs(:publish).yields(nil)

      user_id = 'jane'
      event = 'track user'

      PubSubTracker.instance.send_event(:metrics, user_id, event)
    end
  end
end
