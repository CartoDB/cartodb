# encoding: utf-8

require 'uuidtools'
require_relative '../../../spec_helper'
require_relative '../../../../app/controllers/carto/api/users_controller'

describe Carto::Api::UsersController do
  include_context 'organization with users helper'
  include Warden::Test::Helpers

  describe 'me' do
    it 'returns a hash with current user info' do
      user = @organization.owner
      carto_user = Carto::User.where(id: user.id).first

      login(user)

      get_json api_v3_users_me_url, @headers do |response|
        expect(response.status).to eq(200)

        expect(response.body[:username]).to eq(user.username)
        expect(response.body[:default_fallback_basemap].with_indifferent_access).to eq(user.default_basemap)

        dashboard_notifications = carto_user.notifications_for_category(:dashboard)
        expect(response.body[:dashboard_notifications]).to eq(dashboard_notifications)

        organization_notifications = carto_user.received_notifications.unread.map do |n|
          Carto::Api::ReceivedNotificationPresenter.new(n)
        end
        expect(response.body[:organization_notifications]).to eq(organization_notifications)
      end
    end
  end
end
