# encoding: utf-8

require 'uuidtools'
require_relative '../../../spec_helper'
require_relative '../../../../app/controllers/carto/api/user_creations_controller'

describe Carto::Api::UserCreationsController do
  include_context 'organization with users helper'

  describe 'show' do

    it 'returns 404 for unknown user creations' do
      get_json api_v1_user_creations_show_url(id: UUIDTools::UUID.timestamp_create.to_s), @headers do |response|
        response.status.should == 404
      end
    end

    it 'returns user creation data' do
      ::User.any_instance.stubs(:create_in_central).returns(true)
      CartoDB::UserModule::DBService.any_instance.stubs(:enable_remote_db_user).returns(true)
      user_data = FactoryGirl.build(:valid_user)
      user_data.organization = @organization
      user_data.google_sign_in = false

      user_creation = Carto::UserCreation.new_user_signup(user_data)
      user_creation.next_creation_step until user_creation.finished?

      get_json api_v1_user_creations_show_url(id: user_creation.id), @headers do |response|
        response.status.should == 200
        response.body[:id].should == user_creation.id
        response.body[:username].should == user_creation.username
        response.body[:email].should == user_creation.email
        response.body[:organization_id].should == user_creation.organization_id
        response.body[:google_sign_in].should == user_creation.google_sign_in
        response.body[:requires_validation_email].should == user_creation.requires_validation_email?
        response.body[:state].should == user_creation.state
      end
    end

    it 'triggers user_creation authentication for google users' do
      ::User.any_instance.stubs(:create_in_central).returns(true)
      CartoDB::UserModule::DBService.any_instance.stubs(:enable_remote_db_user).returns(true)
      user_data = FactoryGirl.build(:valid_user)
      user_data.organization = @organization
      user_data.google_sign_in = true

      Carto::Api::UserCreationsController.any_instance.expects(:authenticate!).with(:user_creation, scope: user_data.organization.name).once

      user_creation = Carto::UserCreation.new_user_signup(user_data)
      user_creation.next_creation_step until user_creation.finished?

      get_json api_v1_user_creations_show_url(id: user_creation.id), @headers do |response|
        response.body[:state].should == 'success'
        response.body[:google_sign_in].should == user_creation.google_sign_in
        response.body[:enable_account_token].should be_nil
      end
    end

    it 'does not trigger user_creation authentication for normal users' do
      ::User.any_instance.stubs(:create_in_central).returns(true)
      CartoDB::UserModule::DBService.any_instance.stubs(:enable_remote_db_user).returns(true)
      user_data = FactoryGirl.build(:valid_user)
      user_data.organization = @organization
      user_data.google_sign_in = false

      Carto::Api::UserCreationsController.any_instance.expects(:authenticate!).with(:user_creation, scope: user_data.organization.name).never

      user_creation = Carto::UserCreation.new_user_signup(user_data)
      user_creation.next_creation_step until user_creation.finished?

      get_json api_v1_user_creations_show_url(id: user_creation.id), @headers do |response|
        response.body[:state].should == 'success'
        response.body[:google_sign_in].should == user_creation.google_sign_in
        response.body[:requires_validation_email].should == true
      end
    end
  end

end
