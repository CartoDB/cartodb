require 'spec_helper'

describe Resque::TrackingJobs do

  describe Resque::TrackingJobs::SendPubSubEvent do
    it 'should send event to PubSub tracker' do
      Singleton.__init__(PubSubTracker)
      PubSubTracker.any_instance.stubs(:initialize)

      PubSubTracker.any_instance.expects(:send_event).once

      Resque.enqueue(Resque::TrackingJobs::SendPubSubEvent, 'user_id', 'event_name', {})
    end
  end
end
