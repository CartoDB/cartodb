# encoding: utf-8

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

  describe 'MFA creation' do
    after(:each) do
      @org_user_1.user_multifactor_auths.each(&:destroy!)
    end

    shared_examples_for 'with mfa FF' do
      before(:all) do
        FactoryGirl.create(:feature_flag, restricted: false, name: 'mfa') unless FeatureFlag.where(name: 'mfa').any?
      end

      after(:all) do
        Carto::FeatureFlag.where(name: 'mfa').first.destroy! if FeatureFlag.where(name: 'mfa').any?
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

        FactoryGirl.create(:totp, user_id: @org_user_1.id)
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

    shared_examples_for 'without mfa FF' do
      before(:all) do
        Carto::FeatureFlag.where(name: 'mfa').first.destroy! if FeatureFlag.where(name: 'mfa').any?
      end

      it 'returns 403 for non ff users' do
        login(@organization.owner)
        @organization.owner.reload

        post api_v2_organization_users_mfa_create_url(
          id_or_name: @organization.name,
          u_username: @org_user_1.username,
          type: 'totp'
        )
        last_response.status.should == 403
      end
    end

    describe 'MFA creation with FF' do
      it_behaves_like 'with mfa FF'
    end

    describe 'MFA creation without FF' do
      it_behaves_like 'without mfa FF'
    end
  end

  describe 'MFA deletion' do
    shared_examples_for 'with mfa FF' do
      before(:all) do
        FactoryGirl.create(:feature_flag, restricted: false, name: 'mfa') unless FeatureFlag.where(name: 'mfa').any?
      end

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
        FactoryGirl.create(:totp, user_id: @org_user_1.id)

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

    shared_examples_for 'without mfa FF' do
      before(:all) do
        Carto::FeatureFlag.where(name: 'mfa').first.destroy! if FeatureFlag.where(name: 'mfa').any?
      end

      it 'returns 403 for non ff users' do
        login(@organization.owner)

        @organization.owner.reload

        delete api_v2_organization_users_mfa_delete_url(
          id_or_name: @organization.name,
          u_username: @org_user_1.username,
          type: 'totp'
        )
        last_response.status.should == 403
      end
    end

    describe 'MFA deletion with FF' do
      it_behaves_like 'with mfa FF'
    end

    describe 'MFA deletion without FF' do
      it_behaves_like 'without mfa FF'
    end
  end
end
