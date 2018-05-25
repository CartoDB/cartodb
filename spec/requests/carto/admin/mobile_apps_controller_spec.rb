# encoding: utf-8

require_relative '../../../spec_helper_min'

describe Carto::Admin::MobileAppsController do
  include Warden::Test::Helpers

  TEST_UUID = '00000000-0000-0000-0000-000000000000'.freeze
  MOBILE_APP = {
    id:           TEST_UUID,
    name:         'app_name',
    description:  'Description of the app',
    icon_url:     'http://icon.png',
    platform:     'android',
    app_id:       'com.app.id',
    app_type:     'open'
  }.freeze

  before(:all) do
    @carto_user = FactoryGirl.create(:carto_user, mobile_max_open_users: 10000)
    @user = ::User[@carto_user.id]
  end

  after(:all) do
    @user.destroy
  end

  around(:each) do |example|
    Cartodb.with_config(cartodb_central_api: {}, &example)
  end

  describe '#index' do
    it 'loads apps from Central' do
      Cartodb::Central.stubs(:sync_data_with_cartodb_central?).returns(true)
      Cartodb::Central.any_instance.stubs(:get_mobile_apps).returns(mobile_apps: [], monthly_users: { open: 10000, private: 0 }).once
      login(@user)
      get mobile_apps_path
      response.status.should eq 200
    end

    it 'requires login' do
      get mobile_apps_path
      response.status.should eq 302
    end

    it 'returns 404 if Central disabled' do
      Cartodb::Central.stubs(:sync_data_with_cartodb_central?).returns(false)
      login(@user)
      get mobile_apps_path
      response.status.should eq 404
    end
  end

  describe '#show' do
    it 'loads app from Central' do
      Cartodb::Central.stubs(:sync_data_with_cartodb_central?).returns(true)
      Cartodb::Central.any_instance.stubs(:get_mobile_app).returns(id: TEST_UUID, monthly_users: 0, app_type: 'open', platform: 'android').once
      login(@user)
      get mobile_app_path(id: TEST_UUID)
      response.status.should eq 200
    end

    it 'requires login' do
      get mobile_app_path(id: TEST_UUID)
      response.status.should eq 302
    end

    it 'returns 404 if Central disabled' do
      Cartodb::Central.stubs(:sync_data_with_cartodb_central?).returns(false)
      login(@user)
      get mobile_app_path(id: TEST_UUID)
      response.status.should eq 404
    end
  end

  describe '#create' do
    let(:create_app) { MOBILE_APP.slice(:name, :description, :icon_url, :platform, :app_id, :app_type) }

    it 'creates app in Central' do
      Cartodb::Central.stubs(:sync_data_with_cartodb_central?).returns(true)
      Cartodb::Central.any_instance.stubs(:create_mobile_app).returns({}).once
      login(@user)
      post mobile_apps_path, mobile_app: create_app
      response.status.should eq 302
      response.location.should end_with 'your_apps/mobile'
    end

    it 'validates app before sending to Central' do
      Cartodb::Central.stubs(:sync_data_with_cartodb_central?).returns(true)
      Cartodb::Central.any_instance.stubs(:create_mobile_app).returns({}).never
      login(@user)
      post mobile_apps_path, mobile_app: create_app.merge(name: '')
      response.status.should eq 200
      response.body.should include "Name can't be blank"
    end

    it 'requires login' do
      post mobile_apps_path, mobile_app: create_app
      response.status.should eq 302
    end

    it 'returns 404 if Central disabled' do
      Cartodb::Central.stubs(:sync_data_with_cartodb_central?).returns(false)
      login(@user)
      post mobile_apps_path, mobile_app: create_app
      response.status.should eq 404
    end
  end

  describe '#update' do
    let(:update_app) { MOBILE_APP.slice(:name, :description, :icon_url, :app_type) }

    it 'updates app in Central' do
      Cartodb::Central.stubs(:sync_data_with_cartodb_central?).returns(true)
      Cartodb::Central.any_instance.stubs(:get_mobile_app).returns(MOBILE_APP).once
      Cartodb::Central.any_instance.stubs(:update_mobile_app).returns({}).once
      login(@user)
      put mobile_app_path(id: TEST_UUID), mobile_app: update_app
      response.status.should eq 302
      response.location.should end_with 'your_apps/mobile/' + TEST_UUID
    end

    it 'validates app before sending to Central' do
      Cartodb::Central.stubs(:sync_data_with_cartodb_central?).returns(true)
      Cartodb::Central.any_instance.stubs(:get_mobile_app).returns(id: TEST_UUID, monthly_users: 0, app_type: 'open', platform: 'android').once
      Cartodb::Central.any_instance.stubs(:update_mobile_app).returns(mobile_app: {}).never
      login(@user)
      put mobile_app_path(id: TEST_UUID), mobile_app: update_app.merge(name: '')
      response.status.should eq 200
      response.body.should include "Name can't be blank"
    end

    it 'requires login' do
      put mobile_app_path(id: TEST_UUID), mobile_app: update_app
      response.status.should eq 302
    end

    it 'returns 404 if Central disabled' do
      Cartodb::Central.stubs(:sync_data_with_cartodb_central?).returns(false)
      login(@user)
      put mobile_app_path(id: TEST_UUID), mobile_app: update_app
      response.status.should eq 404
    end
  end

  describe '#destroy' do
    it 'deletes app in Central' do
      Cartodb::Central.stubs(:sync_data_with_cartodb_central?).returns(true)
      Cartodb::Central.any_instance.stubs(:delete_mobile_app).returns({}).once
      login(@user)
      delete mobile_app_path(id: TEST_UUID), password_confirmation: @carto_user.password
      response.status.should eq 302
      response.location.should end_with 'your_apps/mobile'
    end

    it 'requires login' do
      delete mobile_app_path(id: TEST_UUID)
      response.status.should eq 302
    end

    it 'returns 404 if Central disabled' do
      Cartodb::Central.stubs(:sync_data_with_cartodb_central?).returns(false)
      login(@user)
      delete mobile_app_path(id: TEST_UUID)
      response.status.should eq 404
    end
  end
end
