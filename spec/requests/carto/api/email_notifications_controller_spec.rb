require 'spec_helper_min'
require 'support/helpers'

describe Carto::Api::EmailNotificationsController do
  include HelperMethods

  before(:all) do
    @carto_user = create(:carto_user)
  end

  let(:auth_params) do
    { user_domain: @carto_user.username, api_key: @carto_user.api_key }
  end

  describe '#show' do
    it 'always list available notifications with default value if missing in database' do
      get_json(api_v3_email_notifications_show_url(auth_params)) do |response|
        response.status.should eq 200
        response.body.should eq({ notifications: { do_subscriptions: true } })
      end
    end

    it 'list the current notifications' do
      @carto_user.email_notifications = {
        do_subscriptions: false
      }
      get_json(api_v3_email_notifications_show_url(auth_params)) do |response|
        response.status.should eq 200
        response.body.should eq({ notifications: { do_subscriptions: false } })
      end
    end

    it 'return error if unauthenticated' do
      get_json(api_v3_email_notifications_show_url({})) do |response|
        response.status.should eq 401
      end
    end
  end

  describe '#update' do
    it 'return error if unauthenticated' do
      put_json(api_v3_email_notifications_update_url({})) do |response|
        response.status.should eq 401
      end
    end

    it 'returns error if an invalid notification is provided' do
      put_json(api_v3_email_notifications_update_url(auth_params), { notifications: { invalid: true } }) do |response|
        response.status.should eq 500
      end
    end

    it 'successfully updates notifications' do
      params = { notifications: { do_subscriptions: false } }
      put_json(api_v3_email_notifications_update_url(auth_params), params) do |response|
        response.status.should eq 204
      end
    end
  end
end
