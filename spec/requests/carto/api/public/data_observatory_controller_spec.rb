require 'spec_helper_min'
require 'support/helpers'

describe Carto::Api::Public::DataObservatoryController do
  include_context 'users helper'
  include HelperMethods

  before(:all) do
    @master = @user1.api_key
    @not_granted_token = @user1.api_keys.create_regular_key!(name: 'not_do', grants: [{ type: 'apis', apis: [] }]).token
    do_grants = [{ type: 'apis', apis: ['data_observatory_v2'] }]
    @granted_token = @user1.api_keys.create_regular_key!(name: 'do', grants: do_grants).token
    @headers = { 'CONTENT_TYPE' => 'application/json' }
  end

  describe 'token' do
    before(:each) do
      host! "#{@user1.username}.localhost.lan"
    end

    it 'returns 401 if there is no API key' do
      get_json api_v4_do_token_url, @headers do |response|
        expect(response.status).to eq(401)
      end
    end

    it 'returns 401 if the API key is wrong' do
      get_json api_v4_do_token_url(api_key: 'wrong'), @headers do |response|
        expect(response.status).to eq(401)
      end
    end

    it 'returns 403 when using a regular API key without DO grant' do
      get_json api_v4_do_token_url(api_key: @not_granted_token), @headers do |response|
        expect(response.status).to eq(403)
      end
    end

    it 'returns 200 with an access token when using the master API key' do
      expected_body = [{ "access_token" => 'tokenuco' }]
      Cartodb::Central.any_instance.expects(:get_do_token).with(@user1.username).once.returns(expected_body.to_json)

      get_json api_v4_do_token_url(api_key: @master), @headers do |response|
        expect(response.status).to eq(200)
        expect(response.body).to eq expected_body
      end
    end

    it 'returns 200 with an access token when using a regular API key with DO grant' do
      expected_body = [{ "access_token" => 'tokenuco' }]
      Cartodb::Central.any_instance.expects(:get_do_token).with(@user1.username).once.returns(expected_body.to_json)

      get_json api_v4_do_token_url(api_key: @granted_token), @headers do |response|
        expect(response.status).to eq(200)
        expect(response.body).to eq expected_body
      end
    end

    it 'returns 500 if the central call fails' do
      central_error = CentralCommunicationFailure.new('boom')
      Cartodb::Central.any_instance.expects(:get_do_token).with(@user1.username).once.raises(central_error)

      get_json api_v4_do_token_url(api_key: @master), @headers do |response|
        expect(response.status).to eq(500)
      end
    end
  end
end
