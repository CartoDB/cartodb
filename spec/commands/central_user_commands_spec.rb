require 'spec_helper_unit'

describe CentralUserCommands do
  let(:notifications_topic) { mock }
  let(:logger) { Carto::Common::Logger.new(nil) }
  let(:central_user_commands) do
    described_class.new(notifications_topic: notifications_topic,
                        logger: logger)
  end
  let(:account_type) { create(:account_type, account_type: Faker::String.random(length: 8)) }

  describe '#update_user' do
    let(:original_user) { create(:user) }
    let(:user) { original_user.reload } # Small trick to avoid reload in expectations
    let(:feature_flag) { create(:feature_flag, restricted: true) }
    let(:other_feature_flag) { create(:feature_flag, restricted: true) }
    let(:message) { Carto::Common::MessageBroker::Message.new(payload: user_params) }
    let(:rate_limit) { create(:rate_limits) }

    context 'when everything is OK' do
      let(:user_params) do
        {
          remote_user_id: original_user.id,
          quota_in_bytes: 2_000,
          table_quota: 20,
          public_map_quota: 20,
          public_dataset_quota: 20,
          private_map_quota: 20,
          regular_api_key_quota: 20,
          max_layers: 10,
          user_timeout: 100_000,
          database_timeout: 200_000,
          account_type: account_type.account_type,
          private_tables_enabled: true,
          sync_tables_enabled: true,
          upgraded_at: Time.zone.now,
          map_view_block_price: 200,
          geocoding_quota: 230,
          geocoding_block_price: 5,
          here_isolines_quota: 250,
          here_isolines_block_price: 10,
          notification: 'Test',
          available_for_hire: true,
          disqus_shortname: 'abc',
          builder_enabled: true
        }
      end

      # rubocop:disable RSpec/MultipleExpectations
      it 'updates the corresponding attributes' do
        central_user_commands.update_user(message)

        expect(user.quota_in_bytes).to eq(2_000)
        expect(user.table_quota).to eq(20)
        expect(user.public_map_quota).to eq(20)
        expect(user.public_dataset_quota).to eq(20)
        expect(user.regular_api_key_quota).to eq(20)
        expect(user.max_layers).to eq(10)
        expect(user.user_timeout).to eq(100_000)
        expect(user.database_timeout).to eq(200_000)
        expect(user.account_type).to eq(account_type.account_type)
        expect(user.private_tables_enabled).to eq(true)
        expect(user.sync_tables_enabled).to eq(true)
        expect(user.upgraded_at).to be_present
        expect(user.map_view_block_price).to eq(200)
        expect(user.geocoding_quota).to eq(230)
        expect(user.geocoding_block_price).to eq(5)
        expect(user.here_isolines_quota).to eq(250)
        expect(user.here_isolines_block_price).to eq(10)
        expect(user.notification).to eq('Test')
        expect(user.available_for_hire).to eq(true)
        expect(user.disqus_shortname).to eq('abc')
        expect(user.builder_enabled).to eq(true)
      end
      # rubocop:enable RSpec/MultipleExpectations

      it 'successfully handles updates of boolean flags' do
        central_user_commands.update_user(
          Carto::Common::MessageBroker::Message.new(payload: user_params.merge(builder_enabled: true))
        )
        expect(user.reload.builder_enabled).to eq(true)

        central_user_commands.update_user(
          Carto::Common::MessageBroker::Message.new(payload: user_params.merge(builder_enabled: nil))
        )
        expect(user.reload.builder_enabled).to eq(nil)

        central_user_commands.update_user(
          Carto::Common::MessageBroker::Message.new(payload: user_params.merge(builder_enabled: false))
        )
        expect(user.reload.builder_enabled).to eq(false)
      end
    end

    context 'when user belongs to an organization' do
      let(:organization) { create(:organization_with_users) }
      let(:user) { organization.non_owner_users.first }
      let(:user_params) { { remote_user_id: user.id, max_layers: 100 } }

      it 'updates the corresponding attributes' do
        central_user_commands.update_user(message)

        expect(user.reload.max_layers).to eq(100)
      end
    end

    context 'when adding a new feature flag' do
      let(:user_params) do
        { remote_user_id: original_user.id, feature_flags: [feature_flag.id] }
      end

      it 'adds feature flags when they are in the payload' do
        central_user_commands.update_user(message)

        expect(user.has_feature_flag?(feature_flag.name)).to eq(true)
      end
    end

    context 'when removing a subset of all the feature flags' do
      let(:user_params) do
        { remote_user_id: original_user.id, feature_flags: [feature_flag.id] }
      end

      before do
        original_user.feature_flags << feature_flag
        original_user.feature_flags << other_feature_flag
      end

      it 'removes only the specified feature flag' do
        central_user_commands.update_user(message)

        expect(user.has_feature_flag?(feature_flag.name)).to eq(true)
        expect(user.has_feature_flag?(other_feature_flag.name)).to eq(false)
      end
    end

    context 'when removing all feature flags' do
      let(:user_params) do
        { remote_user_id: original_user.id, feature_flags: [] }
      end

      before do
        original_user.feature_flags << feature_flag
        original_user.feature_flags << other_feature_flag
      end

      it 'removes feature flags when requested' do
        central_user_commands.update_user(message)

        expect(user.has_feature_flag?(feature_flag.name)).to eq(false)
        expect(user.has_feature_flag?(other_feature_flag.name)).to eq(false)
      end
    end

    context 'when assigning a new rate limit' do
      let(:user_params) do
        { remote_user_id: original_user.id, rate_limit: rate_limit.api_attributes }
      end

      it 'creates a new rate limit' do
        central_user_commands.update_user(message)

        expect(user.rate_limit.api_attributes).to eq(rate_limit.api_attributes)
      end
    end

    context 'when updating an existing rate limit' do
      let(:new_rate_limit) { create(:rate_limits_custom) }
      let(:user_params) do
        { remote_user_id: original_user.id, rate_limit: new_rate_limit.api_attributes }
      end

      before { user.carto_user.update!(rate_limit_id: rate_limit.id) }

      it 'updates the existing rate limit attributes' do
        central_user_commands.update_user(message)

        expect(user.reload.rate_limit.api_attributes).to eq(new_rate_limit.api_attributes)
      end
    end

    context 'when an attribute is invalid' do
      let(:user_params) { { remote_user_id: original_user.id, email: nil } }

      it 'raises an error' do
        expect { central_user_commands.update_user(message) }.to(
          raise_error(Sequel::ValidationFailed)
        )
      end
    end

    context 'when the user is not found' do
      let(:user_params) { { remote_user_id: Faker::Internet.uuid, quota_in_bytes: 1 } }

      it 'raises an error' do
        expect { central_user_commands.update_user(message) }.to(
          raise_error(ActiveRecord::RecordNotFound)
        )
      end
    end
  end

  describe '#create_user' do
    let(:account_type) { create_account_type_fg(nil) }
    let(:username) { Faker::Internet.username(separators: ['-']) }
    let(:default_user_params) do
      {
        username: username,
        email: Faker::Internet.safe_email,
        password: 'supersecret',
        account_type: account_type.account_type
      }
    end
    let(:message) { Carto::Common::MessageBroker::Message.new(payload: user_params) }
    let(:created_user) { Carto::User.find_by(username: username) }

    before { notifications_topic.stubs(:publish) }

    context 'when everything is OK' do
      let(:user_params) { default_user_params }

      it 'creates a user with the provided params' do
        central_user_commands.create_user(message)

        expect(created_user).to be_present
        expect(created_user.crypted_password).to be_present
      end
    end

    context 'when the payload contains invalid attributes' do
      let(:user_params) { default_user_params.merge(email: nil) }

      it 'raises an error' do
        expect { central_user_commands.create_user(message) }.to raise_error(Sequel::ValidationFailed)
      end
    end

    context 'when specifying custom rate limit attributes' do
      let(:rate_limits) { create(:rate_limits) }
      let(:user_params) do
        default_user_params.merge(rate_limit: rate_limits.api_attributes)
      end

      it 'assigns the correct rate limits' do
        central_user_commands.create_user(message)

        expect(created_user).to be_present
        expect(created_user.rate_limit.api_attributes).to eq(rate_limits.api_attributes)
      end
    end

    context 'with default account settings' do
      let(:upgraded_at_timestamp) { Time.zone.now }
      let(:user_params) do
        default_user_params.merge(
          private_tables_enabled: false,
          sync_tables_enabled: false,
          map_views_quota: 80,
          upgraded_at: upgraded_at_timestamp
        )
      end

      it 'creates the user with default account settings' do
        central_user_commands.create_user(message)

        expect(created_user).to be_present
        expect(created_user.quota_in_bytes).to eq(104_857_600)
        expect(created_user.table_quota).to eq(5)
        expect(created_user.public_map_quota).to be_nil
        expect(created_user.public_dataset_quota).to be_nil
        expect(created_user.private_map_quota).to be_nil
        expect(created_user.regular_api_key_quota).to be_nil
        expect(created_user.account_type).to eq('FREE')
        expect(created_user.private_tables_enabled).to eq(false)
        expect(created_user.upgraded_at).to be_present
      end
    end

    context 'with custom account settings' do
      let(:user_params) do
        default_user_params.merge(
          quota_in_bytes: 2_000,
          table_quota: 20,
          public_map_quota: 20,
          public_dataset_quota: 20,
          private_map_quota: 20,
          regular_api_key_quota: 20,
          account_type: account_type.account_type,
          private_tables_enabled: true,
          sync_tables_enabled: true,
          map_view_block_price: 15,
          geocoding_quota: 15,
          geocoding_block_price: 2,
          here_isolines_quota: 100,
          here_isolines_block_price: 5,
          notification: 'Test'
        )
      end

      # rubocop:disable RSpec/MultipleExpectations
      it 'creates the user with custom account settings' do
        central_user_commands.create_user(message)

        expect(created_user).to be_present
        expect(created_user.quota_in_bytes).to eq(2_000)
        expect(created_user.table_quota).to eq(20)
        expect(created_user.public_map_quota).to eq(20)
        expect(created_user.public_dataset_quota).to eq(20)
        expect(created_user.private_map_quota).to eq(20)
        expect(created_user.regular_api_key_quota).to eq(20)
        expect(created_user.account_type).to eq(account_type.account_type)
        expect(created_user.private_tables_enabled).to eq(true)
        expect(created_user.sync_tables_enabled).to eq(true)
        expect(created_user.map_view_block_price).to eq(15)
        expect(created_user.geocoding_quota).to eq(15)
        expect(created_user.geocoding_block_price).to eq(2)
        expect(created_user.here_isolines_quota).to eq(100)
        expect(created_user.here_isolines_block_price).to eq(5)
        expect(created_user.notification).to eq('Test')
      end
      # rubocop:enable RSpec/MultipleExpectations
    end
  end

  describe '#delete_user' do
    let(:user) { create(:user) }
    let(:message) { Carto::Common::MessageBroker::Message.new(payload: user_params) }
    let(:user_id) { user.id }
    let(:user_params) { { id: user_id } }

    context 'when everything is OK' do
      before do
        notifications_topic.expects(:publish).once.with(:user_deleted, { username: user.username })
      end

      it 'deletes the inteded user' do
        central_user_commands.delete_user(message)

        expect(Carto::User.exists?(id: user_id)).to eq false
      end

      it 'deletes the associated feature flag relations' do
        user.activate_feature_flag!(create(:feature_flag))

        expect { central_user_commands.delete_user(message) }.to(
          change(Carto::FeatureFlagsUser, :count).by(-1)
        )
      end

      it 'destroys the associated rate limit' do
        user.carto_user.update!(rate_limit_id: create(:rate_limits).id)

        expect { central_user_commands.delete_user(message) }.to(
          change(Carto::RateLimit, :count).by(-1)
        )
      end
    end

    context 'when the user belongs to an organization and owns shared entities' do
      let(:organization) { create_organization_with_users(seats: 10) }
      let(:user) { organization.non_owner_users.first }
      let(:shared_table) { create_random_table(user) }

      before { share_table(shared_table, create(:user)) }

      it 'does not delete the user and notifies about the error' do
        notifications_topic.expects(:publish).with(
          :user_could_not_be_deleted,
          { username: user.username, reason: 'user has shared entities' }
        )

        central_user_commands.delete_user(message)

        expect(user.reload).to be_present
        expect(shared_table.reload).to be_present
      end

      context 'when the force flag is set' do
        let(:user_params) { { id: user_id, force: true } }

        before do
          notifications_topic.stubs(:publish)
          central_user_commands.delete_user(message)
        end

        it 'deletes the user' do
          expect(Carto::User.exists?(id: user_id)).to eq(false)
        end
      end
    end

    context 'when the user belongs to an organization and has access to shared entities' do
      let(:organization) { create_organization_with_users(seats: 10) }
      let(:shared_table_owner) { organization.owner }
      let(:user) { organization.non_owner_users.first }
      let(:shared_table) { create_random_table(shared_table_owner) }

      before do
        share_table(shared_table, user)
        notifications_topic.stubs(:publish)
      end

      it 'cleans sharing information when the recipient user is deleted' do
        expect(Carto::SharedEntity.exists?(recipient_id: user.id)).to eq(true)
        expect(
          JSON.parse(shared_table.map.visualization.permission.access_control_list).count
        ).to eq(1)

        central_user_commands.delete_user(message)

        expect(shared_table.reload).to be_present
        expect(Carto::SharedEntity.exists?(recipient_id: user.id)).to eq(false)
        expect(
          JSON.parse(shared_table.reload.map.visualization.permission.access_control_list).count
        ).to eq(0)
      end
    end

    context 'when the user is not found' do
      let(:user_id) { Faker::Internet.uuid }

      it 'logs a warning' do
        logger.expects(:warn).with(message: 'User not found', user_id: user_id, class_name: 'CentralUserCommands')

        central_user_commands.delete_user(message)
      end
    end
  end
end
