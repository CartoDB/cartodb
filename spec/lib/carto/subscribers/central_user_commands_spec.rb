require 'spec_helper'

describe Carto::Subscribers::CentralUserCommands do
  let(:notifications_topic) { mock }
  let(:central_user_commands) { Carto::Subscribers::CentralUserCommands.new(notifications_topic) }

  describe '#update_user' do
    let(:original_user) { create(:user) }
    let(:user) { original_user.reload } # Small trick to avoid reload in expectations
    let(:some_feature_flag) { create(:feature_flag, restricted: true) }

    it 'sets the required fields to their values' do
      user_params = { remote_user_id: original_user.id,
                      quota_in_bytes: 42 }.with_indifferent_access
      central_user_commands.update_user(user_params)
      expect(user.quota_in_bytes).to eq 42
    end

    it 'adds feature flags when they are in the payload' do
      user_params = { remote_user_id: original_user.id,
                      feature_flags: [some_feature_flag.id] }.with_indifferent_access
      central_user_commands.update_user(user_params)
      expect(user.has_feature_flag?(some_feature_flag.name)).to eq true
    end

    it 'removes feature flags when requested' do
      original_user.feature_flags << some_feature_flag
      user_params = { remote_user_id: original_user.id,
                      feature_flags: [] }.with_indifferent_access
      central_user_commands.update_user(user_params)
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
      }.with_indifferent_access
      notifications_topic.stubs(:publish)
      central_user_commands.create_user(user_params)
      expect(Carto::User.exists?(username: 'testuser')).to eq true
    end
  end

  describe '#delete_user' do
    let(:user) { create(:user) }

    it 'deletes the inteded user' do
      user_params = { id: user.id }.with_indifferent_access
      notifications_topic.expects(:publish).once.with(
        :user_deleted,
        { username: user.username }
      )
      central_user_commands.delete_user(user_params)
      expect(Carto::User.exists?(id: user.id)).to eq false
    end
  end
end
