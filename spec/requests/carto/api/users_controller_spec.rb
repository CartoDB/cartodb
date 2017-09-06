# encoding: utf-8

require_relative '../../../spec_helper_min'
require 'support/helpers'
require_relative '../../../../app/controllers/carto/api/users_controller'

describe Carto::Api::UsersController do
  include_context 'organization with users helper'
  include Warden::Test::Helpers
  include HelperMethods

  describe 'me' do
    it 'returns a hash with current user info' do
      user = @organization.owner
      carto_user = Carto::User.where(id: user.id).first

      login(user)

      get_json api_v3_users_me_url, @headers do |response|
        expect(response.status).to eq(200)

        expect(response.body[:default_fallback_basemap].with_indifferent_access).to eq(user.default_basemap)

        dashboard_notifications = carto_user.notifications_for_category(:dashboard)
        expect(response.body[:dashboard_notifications]).to eq(dashboard_notifications)
      end
    end

    it 'returns 401 if user is not logged in' do
      get_json api_v3_users_me_url, @headers do |response|
        expect(response.status).to eq(401)
      end
    end
  end
end
