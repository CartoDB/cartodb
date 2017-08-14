# encoding: utf-8

require 'uuidtools'
require_relative '../../../spec_helper'
require_relative '../../../../app/controllers/carto/api/users_controller'

describe Carto::Api::UsersController do
  include_context 'organization with users helper'
  include Warden::Test::Helpers

  describe 'me' do
    it 'returns a hash with current user info' do
      login(@organization.owner)

      get_json api_v3_users_me_url, @headers do |response|
        expect(response.status).to eq(200)

        expect(response.body[:username]).to eq(@organization.owner.username)
        # TO-DO: Add more expects
      end
    end
  end
end
