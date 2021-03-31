require 'spec_helper_unit'
require_relative '../user_shared_examples'

describe Carto::User do
  let(:user) { create(:carto_user) }
  let(:organization_owner) { create(:carto_user, factory_bot_context: { only_db_setup: true }) }
  let(:organization) { create(:organization, :with_owner, owner: organization_owner) }
  let(:organization_user_1) { organization.owner }
  let(:organization_user_2) do
    create(:carto_user, organization_id: organization.id, factory_bot_context: { only_db_setup: true })
  end

  it_behaves_like 'user models' do
    def get_twitter_imports_count_by_user_id(user_id)
      get_user_by_id(user_id).twitter_imports_count
    end

    def get_user_by_id(user_id)
      Carto::User.where(id: user_id).first
    end

    def create_user
      create(:carto_user)
    end

    def build_user
      build(:carto_user)
    end
  end

  describe '#needs_password_confirmation?' do
    it 'is true for a normal user' do
      user = build(:carto_user, google_sign_in: nil)
      user.needs_password_confirmation?.should == true

      user = build(:carto_user, google_sign_in: false)
      user.needs_password_confirmation?.should == true
    end

    it 'is false for users that signed in with Google' do
      user = build(:carto_user, google_sign_in: true)
      user.needs_password_confirmation?.should == false
    end

    it 'is true for users that signed in with Google but changed the password' do
      user = build(:carto_user, google_sign_in: true, last_password_change_date: Time.now)
      user.needs_password_confirmation?.should == true
    end
  end

  describe '#soft_geocoding_limit' do
    it 'false for free accounts' do
      user.account_type = 'FREE'

      user.soft_geocoding_limit?.should be_false
    end

    it 'false for BASIC and PRO accounts' do
      ['BASIC', 'PRO', 'Individual'].each do |account_type|
        user.account_type = account_type

        user.soft_geocoding_limit?.should be_false
      end
    end
  end

  describe '#default_dataset_privacy' do
    it 'returns the equivalent visualization privacy' do
      no_private_tables_user = build(:carto_user, private_tables_enabled: false)
      no_private_tables_user.default_dataset_privacy.should eq Carto::Visualization::PRIVACY_PUBLIC

      private_tables_user = build(:carto_user, private_tables_enabled: true)
      private_tables_user.default_dataset_privacy.should eq Carto::Visualization::PRIVACY_PRIVATE
    end
  end

  describe "#send_password_reset!" do
    it 'enqueues a job to send an email' do
      Resque.expects(:enqueue).with(::Resque::UserJobs::Mail::PasswordReset, user.id)

      user.send_password_reset!
    end

    it 'updates password_reset_token' do
      expect { user.send_password_reset! }.to change(user, :password_reset_token)
    end

    it 'updates password_reset_sent_at' do
      original_timestamp = user.password_reset_sent_at

      user.send_password_reset!

      expect(user.reload.password_reset_sent_at).not_to eq(original_timestamp)
    end
  end

  describe '#is_email_notification_enabled' do
    it 'returns the notification flag if it exists' do
      notification_type = Carto::UserEmailNotification::NOTIFICATION_DO_SUBSCRIPTIONS
      email_notification = Carto::UserEmailNotification.create(
        user_id: user.id,
        notification: notification_type,
        enabled: false
      )

      expect(user.email_notification_enabled?(notification_type)).to be_false
      email_notification.destroy
    end

    it 'returns true as default if notification is missing' do
      expect(user.email_notification_enabled?('missing')).to be_true
    end

    it 'cascade delete notifications if the user is destroyed' do
      notification_type = Carto::UserEmailNotification::NOTIFICATION_DO_SUBSCRIPTIONS
      email_notification = Carto::UserEmailNotification.create(
        user_id: user.id,
        notification: notification_type,
        enabled: true
      )

      user.destroy
      expect do
        Carto::UserEmailNotification.find(email_notification.id)
      end.to raise_error ActiveRecord::RecordNotFound
    end

    it 'does not create object if an invalid type is provided' do
      email_notification = Carto::UserEmailNotification.new(
        user_id: user.id,
        notification: 'invalid_type',
        enabled: true
      )
      expect(email_notification.valid?).to be_false
    end
  end

  describe '#email_notification=' do
    it 'creates a fresh set of notifications' do
      Carto::UserEmailNotification.any_instance.stubs(:valid_notification).returns(true)
      user.email_notifications = {
        notif_a: true,
        notif_b: false
      }

      expect(user.email_notifications.length).to eq 2
      expect(user.email_notification_enabled?('notif_a')).to be_true
      expect(user.email_notification_enabled?('notif_b')).to be_false
    end

    it 'updates notifications if they already exist' do
      Carto::UserEmailNotification.any_instance.stubs(:valid_notification).returns(true)
      Carto::UserEmailNotification.create(
        user_id: user.id,
        notification: 'existing_notification',
        enabled: true
      )

      user.email_notifications = {
        notif_a: true,
        notif_b: false,
        existing_notification: false
      }

      expect(user.email_notifications.length).to eq 3
      expect(user.email_notification_enabled?('notif_a')).to be_true
      expect(user.email_notification_enabled?('notif_b')).to be_false
      expect(user.email_notification_enabled?('existing_notification')).to be_false
    end

    it 'raises an error if an invalid notification is set' do
      expect do
        user.email_notifications = {
          notif_a: true
        }
      end.to raise_error StandardError
    end
  end
end
