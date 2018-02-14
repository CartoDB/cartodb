require 'spec_helper_min'
require 'support/helpers'

describe 'Warden :auth_api Strategy' do
  include_context 'users helper'
  include HelperMethods

  def generate_api_key_url
    api_keys_url(user_domain: @user_api_keys.username)
  end

  before :all do
    @auth_api_feature_flag = FactoryGirl.create(:feature_flag, name: 'auth_api', restricted: false)
    @user_api_keys = FactoryGirl.create(:valid_user)
    @master_api_key = Carto::ApiKey.where(user_id: @user_api_keys.id).master.first
  end

  after :all do
    @user_api_keys.destroy
    @auth_api_feature_flag.destroy
  end

  it 'authenticates with header' do
    get_json generate_api_key_url, {}, http_json_headers.merge(
      'Authorization' => 'Basic ' + Base64.strict_encode64("#{@user_api_keys.username}:#{@master_api_key.token}")
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
      'Authorization' => 'Basicss ' + Base64.encode64("#{@user_api_keys.username}:#{@master_api_key.token}")
    ) do |response|
      response.status.should eq 401
    end
  end

  it 'returns 401 if base64 is malforemd' do
    get_json generate_api_key_url, {}, http_json_headers.merge(
      'Authorization' => 'Basic ' + "asda2" + Base64.encode64("#{@user_api_keys.username}:#{@master_api_key.token}")
    ) do |response|
      response.status.should eq 401
    end
  end
end
