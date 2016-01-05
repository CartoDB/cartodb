require 'active_support/time'
require_relative '../../spec_helper'
require_relative '../../../lib/resque/user_jobs'

describe Resque::UserJobs::Metadata::UserMetadataPropagation do
  let(:user_mock) do
    user_mock = mock()
    user_mock.stubs(:id).returns('kk')
    user_mock.stubs(:dashboard_viewed_at).returns(Time.now - 9.hours)
    user_mock.stubs(:db_size_in_bytes).returns(123)
    user_mock
  end

  describe '#trigger_metadata_propagation_if_needed' do
    it 'triggers for users without dashboard_viewed_at' do
      user_mock.stubs(:dashboard_viewed_at).returns(nil)
      ::Resque.expects(:enqueue).with(::Resque::UserJobs::Metadata::UserMetadataPropagation, user_mock.id).once

      ::Resque::UserJobs::Metadata::UserMetadataPropagation.trigger_metadata_propagation_if_needed(user_mock)
    end

    it 'does not trigger for users with dashboard_viewed_at closer than 8 hours' do
      user_mock.stubs(:dashboard_viewed_at).returns(Time.now - 7.hours)
      ::Resque.expects(:enqueue).never

      ::Resque::UserJobs::Metadata::UserMetadataPropagation.trigger_metadata_propagation_if_needed(user_mock)
    end

    it 'triggers for users with dashboard_viewed_at after more than 8 hours' do
      user_mock.stubs(:dashboard_viewed_at).returns(Time.now - 9.hours)
      ::Resque.expects(:enqueue).with(::Resque::UserJobs::Metadata::UserMetadataPropagation, user_mock.id).once

      ::Resque::UserJobs::Metadata::UserMetadataPropagation.trigger_metadata_propagation_if_needed(user_mock)
    end
  end

  describe '#perform' do
    it 'calls Hubspot#update_user_metadata' do
      ::User.stubs(:where).with(id: user_mock.id).returns(mock(first: user_mock))
      Carto::UsersMetadataRedisCache.any_instance.expects(:set_db_size_in_bytes).with(user_mock)

      ::Resque::UserJobs::Metadata::UserMetadataPropagation.perform(user_mock.id)
    end
  end
end
