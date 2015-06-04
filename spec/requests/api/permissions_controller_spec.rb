# encoding: utf-8
require 'sequel'
require 'rack/test'
require 'json'
require 'uri'

require_relative '../../spec_helper'
require_relative '../../../app/controllers/api/json/synchronizations_controller'

include CartoDB

def app
  CartoDB::Application.new
end

describe Api::Json::PermissionsController do
  include Rack::Test::Methods

  before(:all) do
    @user = create_user(
      username: 'test',
      email:    'client@example.com',
      password: 'clientex'
    )
    @api_key = @user.api_key

    @user2 = create_user(
        username: 'test2',
        email:    'client2@example.com',
        password: 'clientex2',
        avatar_url: 'whatever1'
    )
    @user3 = create_user(
        username: 'test3',
        email:    'client3@example.com',
        password: 'clientex3',
        avatar_url: nil
    )
  end

  before(:each) do
    delete_user_data @user
    delete_user_data @user2
    delete_user_data @user3
    @headers = {
      'CONTENT_TYPE'  => 'application/json',
    }
    host! 'test.localhost.lan'
    Permission.any_instance.stubs(:revoke_previous_permissions).returns(nil)
    Permission.any_instance.stubs(:grant_db_permission).returns(nil)
    Permission.any_instance.stubs(:notify_permissions_change).returns(nil)
    vis_entity_mock = mock
    vis_entity_mock.stubs(:table?).returns(false)
    Permission.any_instance.stubs(:entity).returns(vis_entity_mock)
  end

  after(:all) do
    @user.destroy
    @user2.destroy
    @user3.destroy
  end

  describe 'PUT /api/v1/perm' do
    it 'modifies an existing permission' do
      entity_id = UUIDTools::UUID.timestamp_create.to_s
      entity_type = Permission::ENTITY_TYPE_VISUALIZATION

      acl_initial = [ ]
      client_acl_modified = [
        {
          type: Permission::TYPE_USER,
          entity: {
            id:   @user2.id,
          },
          access: Permission::ACCESS_READONLY
        }
      ]
      client_acl_modified_expected = [
          {
              type: Permission::TYPE_USER,
              entity: {
                  id:         @user2.id,
                  username:   @user2.username,
                  avatar_url: @user2.avatar_url,
                  base_url:   @user2.public_url,
              },
              access: Permission::ACCESS_READONLY
          }
      ]
      client_acl_final = [ ]

      permission = CartoDB::Permission.new(
          owner_id: @user.id,
          owner_username: @user.username,
          entity_id:      entity_id,
          entity_type:    entity_type
      )
      permission.acl = acl_initial
      permission.save
      # To force updated_at to change
      sleep(1)

      put "/api/v1/perm/#{permission.id}?api_key=#{@api_key}", {acl: client_acl_modified}.to_json, @headers
      last_response.status.should == 200
      response = JSON.parse(last_response.body, symbolize_names: true)
      response.fetch(:id).should eq permission.id
      owner_fragment = response.fetch(:owner)
      owner_fragment[:id].should eq permission.owner_id
      owner_fragment[:username].should eq permission.owner_username
      entity_fragment = response.fetch(:entity)
      entity_fragment[:id].should eq entity_id
      entity_fragment[:type].should eq entity_type
      Time.parse(response.fetch(:created_at)).to_i.should eq permission.created_at.to_i
      Time.parse(response.fetch(:updated_at)).to_i.should_not eq permission.updated_at.to_i
      response.fetch(:acl).should eq client_acl_modified_expected
      put "/api/v1/perm/#{permission.id}?api_key=#{@api_key}", {acl: client_acl_final}.to_json, @headers
      last_response.status.should == 200
      response = JSON.parse(last_response.body, symbolize_names: true)
      response.fetch(:acl).should eq client_acl_final
    end
  end

  describe 'PUT/DELETE /api/v1/perm' do
    it "makes sure we don't expose unwanted call types" do
      permission = CartoDB::Permission.new(
          owner_id: @user.id,
          owner_username: @user.username,
          entity_id:      UUIDTools::UUID.timestamp_create.to_s,
          entity_type:    Permission::ENTITY_TYPE_VISUALIZATION
      )
      permission.save

      expect {
        post "/api/v1/perm/#{permission.id}?api_key=#{@api_key}", nil, @headers
      }.to raise_exception ActionController::RoutingError
      expect {
        delete "/api/v1/perm/#{permission.id}?api_key=#{@api_key}", nil, @headers
      }.to raise_exception ActionController::RoutingError
    end
  end

end
