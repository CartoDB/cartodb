require 'spec_helper_min'
require 'support/helpers'

describe 'Warden :auth_api Strategy' do
  include_context 'users helper'
  include HelperMethods

  def generate_api_key_url
    api_keys_url(user_domain: @user1.username)
  end

  before :all do
    @auth_api_feature_flag = FactoryGirl.create(:feature_flag, name: 'auth_api', restricted: false)
    @master_api_key = FactoryGirl.create(:api_key_apis, user_id: @user1.id, type: 'master')
  end

  after :all do
    @master_api_key.destroy
    @auth_api_feature_flag.destroy
  end

  it 'authenticates with header' do
    get_json generate_api_key_url, {}, http_json_headers.merge(
      'Authorization' => 'Basic ' + Base64.encode64("#{@user1.username}:#{@master_api_key.token}")
    ) do |response|
      response.status.should eq 200
    end
  end

  it 'returns 401 if header is missing' do
    get_json generate_api_key_url, {}, http_json_headers do |response|
      response.status.should eq 401
    end
  end

  it 'returns 401 if header is malformed' do
    get_json generate_api_key_url, {}, http_json_headers.merge(
      'Authorization' => 'Basicss ' + Base64.encode64("#{@user1.username}:#{@master_api_key.token}")
    ) do |response|
      response.status.should eq 401
    end
  end

  it 'returns 401 if base64 is malforemd' do
    get_json generate_api_key_url, {}, http_json_headers.merge(
      'Authorization' => 'Basic ' + "asda2" + Base64.encode64("#{@user1.username}:#{@master_api_key.token}")
    ) do |response|
      response.status.should eq 401
    end
  end
end
