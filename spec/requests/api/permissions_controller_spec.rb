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
  end

  before(:each) do
    delete_user_data @user
    @headers = {
      'CONTENT_TYPE'  => 'application/json',
      'HTTP_HOST'     => 'test.localhost.lan'
    }
  end

  describe 'GET /api/v1/perm' do
    it 'returns an existing permission' do
      user2_id = UUIDTools::UUID.timestamp_create.to_s
      user2_username = 'test2'
      user3_id = UUIDTools::UUID.timestamp_create.to_s
      user23username = 'test2'

      acl = [
        {
          user: {
            id: user2_id,
            username: user2_username
          },
          type: Permission::TYPE_READONLY
        },
        {
          user: {
            id: user3_id,
            username: user23username
          },
          type: Permission::TYPE_READWRITE
        }
      ]
      response_acl = [
        {
          user: {
            id: user2_id,
            username: user2_username
          },
          type: Permission::TYPE_READONLY
        },
        {
          user: {
            id: user3_id,
            username: user23username
          },
          type: Permission::TYPE_READWRITE
        }
      ]

      permission = CartoDB::Permission.new(
          owner_id: @user.id, owner_username: @user.username
      )
      permission.acl = acl
      permission.save

      get "/api/v1/perm/#{permission.id}?api_key=#{@api_key}", nil, @headers
      last_response.status.should == 200
      response = JSON.parse(last_response.body, symbolize_names: true)
      response.fetch(:id).should eq permission.id
      owner_fragment = response.fetch(:owner)
      owner_fragment[:id].should eq permission.owner_id
      owner_fragment[:username].should eq permission.owner_username
      Time.parse(response.fetch(:updated_at)).to_i.should eq permission.updated_at.to_i
      Time.parse(response.fetch(:created_at)).to_i.should eq permission.created_at.to_i
      response.fetch(:acl).should eq response_acl
    end
  end

  describe 'POST /api/v1/perm' do
    it 'modifies an existing permission' do
      user2 = create_user(
        username: 'test2',
        email:    'client2@example.com',
        password: 'clientex2'
      )

      acl_initial = [ ]
      client_acl_modified = [
        {
          user: {
            id: user2.id,
            username: user2.username
          },
          type: Permission::TYPE_READONLY
        }
      ]
      client_acl_final = [ ]

      permission = CartoDB::Permission.new(
          owner_id: @user.id, owner_username: @user.username
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
      Time.parse(response.fetch(:created_at)).to_i.should eq permission.created_at.to_i
      Time.parse(response.fetch(:updated_at)).to_i.should_not eq permission.updated_at.to_i
      response.fetch(:acl).should eq client_acl_modified
      # To force updated_at to change
      sleep(1)
      put "/api/v1/perm/#{permission.id}?api_key=#{@api_key}", {acl: client_acl_final}.to_json, @headers
      last_response.status.should == 200
      response = JSON.parse(last_response.body, symbolize_names: true)
      response.fetch(:acl).should eq client_acl_final
    end
  end

  describe 'PUT/DELETE /api/v1/perm' do
    it "makes sure we don't expose unwanted call types" do
      permission = CartoDB::Permission.new(
          owner_id: @user.id, owner_username: @user.username
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
