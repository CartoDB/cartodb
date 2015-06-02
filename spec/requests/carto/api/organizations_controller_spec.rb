# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '../../../../app/controllers/carto/api/organizations_controller'

describe Carto::Api::OrganizationsController do
  include_context 'organization with users helper'
  include Rack::Test::Methods
  include Warden::Test::Helpers

  describe 'users unauthenticated behaviour' do

    it 'returns 401 for not logged users' do
      get api_v1_1_organization_users_url(id: @organization.id), @headers
      last_response.status.should == 401
    end
  end

  describe 'users' do

    before(:each) do
      login(@org_user_1)
    end

    it 'returns 401 for users requesting an organization that they are not owners of' do
      get api_v1_1_organization_users_url(id: @organization_2.id, api_key: @org_user_1.api_key), @headers
      last_response.status.should == 401
    end

    it 'returns organization users sorted by username' do
      get api_v1_1_organization_users_url(id: @organization.id, api_key: @org_user_1.api_key), @headers
      last_response.status.should == 200
      json_body = JSON.parse(last_response.body)
      ids = json_body['users'].map { |u| u['id'] } 
      ids[0].should == @org_user_1.id
      ids[1].should == @org_user_2.id
    end

    it 'returns organization users paged' do
      get api_v1_1_organization_users_url(id: @organization.id, api_key: @org_user_1.api_key, page: 1, per_page: 1), @headers
      last_response.status.should == 200
      json_body = JSON.parse(last_response.body)
      ids = json_body['users'].map { |u| u['id'] } 
      ids.count.should == 1
      ids[0].should == @org_user_1.id

      get api_v1_1_organization_users_url(id: @organization.id, api_key: @org_user_1.api_key, page: 2, per_page: 1), @headers
      last_response.status.should == 200
      json_body = JSON.parse(last_response.body)
      ids = json_body['users'].map { |u| u['id'] } 
      ids.count.should == 1
      ids[0].should == @org_user_2.id
    end

    it 'returns users matching username query' do
      username = @org_user_2.username
      [username, username[1, 10], username[-4, 10]].each { |q|
        get api_v1_1_organization_users_url(id: @organization.id, api_key: @org_user_1.api_key, q: q), @headers
        last_response.status.should == 200
        json_body = JSON.parse(last_response.body)
        ids = json_body['users'].map { |u| u['id'] }
        ids.count.should == 1
        ids[0].should == @org_user_2.id
      }
    end

    it 'returns users matching email query' do
      email = @org_user_2.email
      [email].each { |q|
        get api_v1_1_organization_users_url(id: @organization.id, api_key: @org_user_1.api_key, q: q), @headers
        last_response.status.should == 200
        json_body = JSON.parse(last_response.body)
        ids = json_body['users'].map { |u| u['id'] }
        ids.count.should == 1
        ids[0].should == @org_user_2.id
      }
    end

  end

end
