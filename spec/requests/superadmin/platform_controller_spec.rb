# encoding: utf-8

require_relative '../../acceptance_helper'
require_relative '../../../app/controllers/superadmin/platform_controller'

describe Superadmin::PlatformController do
  before(:all) do
    @dbhost = '127.0.0.127'
    CartoDB::UserModule::DBService.any_instance.stubs(:enable_remote_db_user).returns(true)
    @user1 = FactoryGirl.create(:valid_user)
    @user2 = FactoryGirl.create(:valid_user)
    [@user1, @user2].each do |u|
      u.database_host = @dbhost
      u.save
    end
  end

  after(:all) do
    @user1.destroy
    @user2.destroy
  end

  describe '#databases info' do
    it 'returns just one database info if passed as argument' do
      @user1.database_host = 'test1.dbhost.com'
      get superadmin_get_databases_info_url, { database_host: @user1.database_host }, superadmin_headers
      response.status.should == 200
      body = JSON.parse(response.body)
      body.has_key?('test1.dbhost.com').should == true
      body.size.should == 1
      @user1.database_host = @dbhost
    end

    it 'returns just two databases info if none passed as argument' do
      get superadmin_get_databases_info_url, {}, superadmin_headers
      response.status.should == 200
      body = JSON.parse(response.body)
      body[@user1.database_host]['count'].should == 2
    end
  end

  describe '#database validation' do
    it 'returns 400 if request doesnt have database_host' do
      get superadmin_database_validation_url, {}, superadmin_headers
      response.status.should == 400
    end

    it 'validate for database checking for active users using metadata' do
      get superadmin_database_validation_url, { database_host: @dbhost }, superadmin_headers
      response.status.should == 200
      body = JSON.parse(response.body)
      body['carto_users'].size.should == 2
      body['carto_users'].include?(@user1.username)
      body['carto_users'].include?(@user2.username)
    end

    it 'validate for database checking for one active and one migrated user' do
      old_db_host = @user2.database_host
      @user2.database_host = 'test2.dbhost.com'
      @user2.save
      get superadmin_database_validation_url, { database_host: @dbhost }, superadmin_headers
      response.status.should == 200
      body = JSON.parse(response.body)
      body['carto_users'].size.should == 1
      body['carto_users'].include?(@user1.username)
      @user2.database_host = old_db_host
    end
  end
end
