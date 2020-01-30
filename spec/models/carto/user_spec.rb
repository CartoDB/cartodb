require_relative '../../spec_helper'
require_relative '../user_shared_examples'

describe Carto::User do
  it_behaves_like 'user models' do
    def get_twitter_imports_count_by_user_id(user_id)
      get_user_by_id(user_id).twitter_imports_count
    end

    def get_user_by_id(user_id)
      Carto::User.where(id: user_id).first
    end

    def create_user
      FactoryGirl.create(:carto_user)
    end
  end

  describe '#needs_password_confirmation?' do
    it 'is true for a normal user' do
      user = FactoryGirl.build(:carto_user, google_sign_in: nil)
      user.needs_password_confirmation?.should == true

      user = FactoryGirl.build(:carto_user, google_sign_in: false)
      user.needs_password_confirmation?.should == true
    end

    it 'is false for users that signed in with Google' do
      user = FactoryGirl.build(:carto_user, google_sign_in: true)
      user.needs_password_confirmation?.should == false
    end

    it 'is true for users that signed in with Google but changed the password' do
      user = FactoryGirl.build(:carto_user, google_sign_in: true, last_password_change_date: Time.now)
      user.needs_password_confirmation?.should == true
    end
  end

  describe '#soft_geocoding_limit' do
    before(:all) do
      @carto_user = FactoryGirl.build(:carto_user)
    end

    it 'false for free accounts' do
      @carto_user.account_type = 'FREE'

      @carto_user.soft_geocoding_limit?.should be_false
    end

    it 'false for BASIC and PRO accounts' do
      ['BASIC', 'PRO', 'Individual'].each do |account_type|
        @carto_user.account_type = account_type

        @carto_user.soft_geocoding_limit?.should be_false
      end
    end
  end

  describe '#default_dataset_privacy' do
    it 'returns the equivalent visualization privacy' do
      no_private_tables_user = FactoryGirl.build(:carto_user, private_tables_enabled: false)
      no_private_tables_user.default_dataset_privacy.should eq Carto::Visualization::PRIVACY_PUBLIC

      private_tables_user = FactoryGirl.build(:carto_user, private_tables_enabled: true)
      private_tables_user.default_dataset_privacy.should eq Carto::Visualization::PRIVACY_PRIVATE
    end
  end

  describe "#send_password_reset!" do
    before(:all) do
      @user = FactoryGirl.create(:carto_user)
    end

    after(:all) do
      @user.destroy
    end

    it 'enqueues a job to send an email' do
      Resque.expects(:enqueue).with(::Resque::UserJobs::Mail::PasswordReset, @user.id)

      @user.send_password_reset!
    end

    it 'updates password_reset_token' do
      expect { @user.send_password_reset! }.to change(@user, :password_reset_token)
    end

    it 'updates password_reset_sent_at' do
      now = Time.zone.now

      Delorean.time_travel_to(now) do
        @user.send_password_reset!
      end

      @user.password_reset_sent_at.to_s.should eql now.to_s
    end
  end

  describe 'session' do

    before(:all) do
      @user = FactoryGirl.create(:valid_user)
    end

    after(:all) do
      @user.destroy
    end

    it 'salt should be generated at creation' do
      @user.session_salt.should_not be_nil
    end

    it 'security token should include salt' do
      sec_token = Digest::SHA1.hexdigest(@user.crypted_password + @user.session_salt)
      @user.security_token.should == sec_token
    end

    it 'invalidation should modify salt and update central' do
      Cartodb::Central.any_instance.expects(:send_request)
      initial_salt = @user.session_salt

      @user.invalidate_all_sessions!

      initial_salt.should_not == @user.session_salt
    end
  end
end
