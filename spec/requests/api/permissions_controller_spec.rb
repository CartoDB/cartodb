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
      user2 = create_user(
          username: 'test2',
          email:    'client2@example.com',
          password: 'clientex2'
      )

      acl = [
          {
              id: user2.id,
              name: user2.username,
              type: Permission::TYPE_READONLY
          }
      ]
      response_acl = [
          {
            user: {
              id: user2.id,
              username: user2.username,
              type: Permission::TYPE_READONLY
            }
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

end
