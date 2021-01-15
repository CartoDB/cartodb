require 'spec_helper'

describe Carto::Subscribers::CentralUserCommands do
  let(:notifications_topic) { mock }
  let(:logger) { Carto::Common::Logger.new(nil) }
  let(:central_user_commands) do
    described_class.new(notifications_topic: notifications_topic,
                        logger: logger)
  end

  describe '#update_user' do
    let(:original_user) { create(:user) }
    let(:user) { original_user.reload } # Small trick to avoid reload in expectations
    let(:some_feature_flag) { create(:feature_flag, restricted: true) }

    it 'sets the required fields to their values' do
      user_params = { remote_user_id: original_user.id,
                      quota_in_bytes: 42 }
      message = Carto::Common::MessageBroker::Message.new(payload: user_params)
      central_user_commands.update_user(message)
      expect(user.quota_in_bytes).to eq 42
    end

    it 'adds feature flags when they are in the payload' do
      user_params = { remote_user_id: original_user.id,
                      feature_flags: [some_feature_flag.id] }
      message = Carto::Common::MessageBroker::Message.new(payload: user_params)
      central_user_commands.update_user(message)
      expect(user.has_feature_flag?(some_feature_flag.name)).to eq true
    end

    it 'removes feature flags when requested' do
      original_user.feature_flags << some_feature_flag
      user_params = { remote_user_id: original_user.id,
                      feature_flags: [] }
      message = Carto::Common::MessageBroker::Message.new(payload: user_params)
      central_user_commands.update_user(message)
      expect(user.has_feature_flag?(some_feature_flag.name)).to eq false
    end
  end

  describe '#create_user' do
    let(:account_type) { create_account_type_fg(nil) }

    it 'creates a user with the provided params' do
      user_params = {
        username: 'testuser',
        email: 'testuser@acme.org',
        password: 'supersecret',
        account_type: account_type.account_type
      }
      notifications_topic.stubs(:publish)
      message = Carto::Common::MessageBroker::Message.new(payload: user_params)
      central_user_commands.create_user(message)
      expect(Carto::User.exists?(username: 'testuser')).to eq true
    end
  end

  describe '#delete_user' do
    let(:user) { create(:user) }

    it 'deletes the inteded user' do
      user_params = { id: user.id }
      notifications_topic.expects(:publish).once.with(
        :user_deleted,
        { username: user.username }
      )
      message = Carto::Common::MessageBroker::Message.new(payload: user_params)
      central_user_commands.delete_user(message)
      expect(Carto::User.exists?(id: user.id)).to eq false
    end
  end
end
