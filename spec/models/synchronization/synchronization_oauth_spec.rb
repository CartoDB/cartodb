require 'spec_helper'

describe SynchronizationOauth do

  before(:all) do
    @user = create_user(:quota_in_bytes => 500.megabytes, :table_quota => 500)
    @user.reload
  end

  after(:all) do
    bypass_named_maps
    @user.destroy
  end

  after(:each) do
    # @user.synchronization_oauths.map &:destroy
    @user.reload
  end

  # Skipped because this is being substituted by Connections
  before { pending }

  context '#creation_updating' do
    it 'Tests basic creation operations' do
      service_name = 'testtest'
      token_value = 'qv2345q235erfaweerfdsdfsds'
      token_value_2 = 'aaaaaaaaaaaaaaaaaaaaaaaa'

      SynchronizationOauth.all.size.should eq 0

      oauth_entry = SynchronizationOauth.create(
          user_id: @user.id,
          service: service_name,
          token: token_value
      ).reload

      oauth_entry.nil?.should eq false
      oauth_entry.user_id.should eq @user.id
      oauth_entry.service.should eq service_name
      oauth_entry.token.should eq token_value

      SynchronizationOauth.all.size.should eq 1

      entry_second_handle = SynchronizationOauth.where(user_id: @user.id, service: service_name).first
      entry_second_handle.nil?.should eq false
      entry_second_handle.user_id.should eq @user.id
      entry_second_handle.service.should eq service_name
      entry_second_handle.token.should eq token_value

      entry_second_handle.should eq oauth_entry

      oauth_entry.token = token_value_2
      oauth_entry.save.reload
      oauth_entry.token.should eq token_value_2

      expect {
        oauth_entry.service = 'another_service_name'
        oauth_entry.save
      }.to raise_exception Sequel::ValidationFailed
      oauth_entry.service = service_name

      expect {
        oauth_entry.user_id = Carto::UUIDHelper.random_uuid
        oauth_entry.save
      }.to raise_exception Sequel::ValidationFailed

      expect {
        SynchronizationOauth.create(
            user_id: @user.id,
            service: service_name,
            token: Carto::UUIDHelper.random_uuid
        )
      }.to raise_exception Sequel::ValidationFailed

      expect {
        SynchronizationOauth.create(
          user_id: @user_id,
          service: service_name,
          token: nil
        )
      }.to raise_exception Sequel::ValidationFailed

      expect {
        SynchronizationOauth.create(
          user_id: @user_id,
          service: service_name,
          token: ''
        )
      }.to raise_exception Sequel::ValidationFailed
    end
  end

  context '#deletion' do
    it 'tests deletion of items' do
      another_uuid = Carto::UUIDHelper.random_uuid
      service_name = 'testtest'
      service_name_2 = '123456'
      token_value = 'qv2345q235erfaweerfdsdfsds'
      token_value_2 = 'aaaaaaaaaaaaaaaaaaaaaaaa'

      SynchronizationOauth.create(
          user_id: @user.id,
          service: service_name,
          token: token_value
      )
      SynchronizationOauth.create(
          user_id: @user.id,
          service: service_name_2,
          token: token_value_2
      )
      SynchronizationOauth.create(
          user_id: another_uuid,
          service: service_name_2,
          token: token_value_2
      )

      @user.synchronization_oauths.size.should eq 2

      oauth = SynchronizationOauth.where(user_id: @user.id, service: service_name).first
      oauth.destroy
      @user.reload
      @user.synchronization_oauths.size.should eq 1

      oauth = SynchronizationOauth.where(user_id: @user.id, service: service_name_2).first
      oauth.destroy
      @user.reload
      @user.synchronization_oauths.size.should eq 0
    end
  end

  context '#user_oauths' do
    it 'tests the one to many association of user and sync oauths' do
      service_name = 'testtest'
      token_value = 'qv2345q235erfaweerfdsdfsds'

      @user.synchronization_oauths.size.should eq 0

      SynchronizationOauth.create(
          user_id: @user.id,
          service: service_name,
          token: token_value
      )
      @user.reload
      @user.synchronization_oauths.size.should eq 1

      retrieved_entry = @user.synchronization_oauths.first
      @user.synchronization_oauths.first.should eq retrieved_entry

      @user.synchronization_oauths.first.destroy
      @user.reload
      @user.synchronization_oauths.size.should eq 0

      @user.add_synchronization_oauth(service: service_name, token: token_value)
      @user.synchronization_oauths.size.should eq 1

      expect {
        @user.add_synchronization_oauth(service: service_name, token: token_value)
      }.to raise_exception Sequel::ValidationFailed

    end
  end

end
