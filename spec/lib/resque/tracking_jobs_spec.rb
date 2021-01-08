require 'spec_helper'

describe Resque::TrackingJobs do

  describe Resque::TrackingJobs::SendPubSubEvent do
    it 'should send event to PubSub tracker' do
      Singleton.__init__(PubSubTracker)
      allow_any_instance_of(PubSubTracker).to receive(:initialize)

      expect_any_instance_of(PubSubTracker).to receive(:send_event).once

      Resque.enqueue(Resque::TrackingJobs::SendPubSubEvent, 'user_id', 'event_name', {})
    end
  end
end
