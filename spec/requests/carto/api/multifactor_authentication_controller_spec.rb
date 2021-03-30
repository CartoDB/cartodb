require_relative '../../../spec_helper'

describe Carto::Api::MultifactorAuthenticationController do
  include_context 'organization with users helper'
  include Rack::Test::Methods
  include Warden::Test::Helpers

  before(:each) do
    ::User.any_instance.stubs(:validate_credentials_not_taken_in_central).returns(true)
    ::User.any_instance.stubs(:create_in_central).returns(true)
    ::User.any_instance.stubs(:update_in_central).returns(true)
    ::User.any_instance.stubs(:delete_in_central).returns(true)
    ::User.any_instance.stubs(:load_common_data).returns(true)
    ::User.any_instance.stubs(:reload_avatar).returns(true)
  end

  describe 'MFA show' do
    after(:each) do
      @org_user_1.user_multifactor_auths.each(&:destroy!)
    end

    it 'returns 401 for non authorized calls' do
      get api_v2_organization_users_mfa_show_url(
        id_or_name: @organization.name,
        u_username: @org_user_1.username,
        type: 'totp'
      )
      last_response.status.should == 401
    end

    it 'returns 401 for non authorized users' do
      login(@org_user_1)

      get api_v2_organization_users_mfa_show_url(
        id_or_name: @organization.name,
        u_username: @org_user_1.username,
        type: 'totp'
      )
      last_response.status.should == 401
    end

    it 'correctly shows MFA configured' do
      login(@organization.owner)
      @organization.owner.reload

      create(:totp, user_id: @org_user_1.id)
        get api_v2_organization_users_mfa_show_url(
          id_or_name: @organization.name,
          u_username: @org_user_1.username,
          type: 'totp'
        )
        expect(JSON.parse(last_response.body)['mfa_required']).to eq true
    end

    it 'correctly shows MFA not configured' do
      login(@organization.owner)
      @organization.owner.reload

      get api_v2_organization_users_mfa_show_url(
        id_or_name: @organization.name,
        u_username: @org_user_1.username,
        type: 'totp'
      )
      expect(JSON.parse(last_response.body)['mfa_required']).to eq false
    end
  end

  describe 'MFA creation' do
    after(:each) do
      @org_user_1.user_multifactor_auths.each(&:destroy!)
    end

    it 'returns 401 for non authorized calls' do
      post api_v2_organization_users_mfa_create_url(
        id_or_name: @organization.name,
        u_username: @org_user_1.username,
        type: 'totp'
      )
      last_response.status.should == 401
    end

    it 'returns 401 for non authorized users' do
      login(@org_user_1)

      post api_v2_organization_users_mfa_create_url(
        id_or_name: @organization.name,
        u_username: @org_user_1.username,
        type: 'totp'
      )
      last_response.status.should == 401
    end

    it 'correctly creates an MFA' do
      login(@organization.owner)
      @organization.owner.reload

      expect {
        post api_v2_organization_users_mfa_create_url(
          id_or_name: @organization.name,
          u_username: @org_user_1.username,
          type: 'totp'
        )
      }.to change(@org_user_1.user_multifactor_auths, :count).by(1)
    end

    it 'raises an error if MFA already exists' do
      login(@organization.owner)
      @organization.owner.reload

      create(:totp, user_id: @org_user_1.id)
      post api_v2_organization_users_mfa_create_url(
        id_or_name: @organization.name,
        u_username: @org_user_1.username,
        type: 'totp'
      ) do |response|
        response.status.should eq 422
      end

      @org_user_1.reload
      @org_user_1.user_multifactor_auths.count.should eq 1
    end
  end

  describe 'MFA deletion' do
    it 'returns 401 for non authorized calls' do
      delete api_v2_organization_users_mfa_delete_url(
        id_or_name: @organization.name,
        u_username: @org_user_1.username,
        type: 'totp'
      )
      last_response.status.should == 401
    end

    it 'returns 401 for non authorized users' do
      login(@org_user_1)

      delete api_v2_organization_users_mfa_delete_url(
        id_or_name: @organization.name,
        u_username: @org_user_1.username,
        type: 'totp'
      )
      last_response.status.should == 401
    end

    it 'deletes MFA' do
      login(@organization.owner)
      @organization.owner.reload
      create(:totp, user_id: @org_user_1.id)

      expect {
        delete api_v2_organization_users_mfa_delete_url(
          id_or_name: @organization.name,
          u_username: @org_user_1.username,
          type: 'totp'
        )
      }.to change(@org_user_1.reload.user_multifactor_auths, :count).by(-1)
    end

    it 'raises an error if MFA does not exist' do
      login(@organization.owner)
      @organization.owner.reload

      delete api_v2_organization_users_mfa_delete_url(
        id_or_name: @organization.name,
        u_username: @org_user_1.username,
        type: 'totp'
      )

      last_response.status.should eq 422
    end
  end
end
