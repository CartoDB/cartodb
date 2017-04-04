require 'spec_helper_min'
require 'support/helpers'

describe Carto::Api::StaticNotificationsController do
  include Carto::Factories::Visualizations
  include HelperMethods

  before(:all) do
    @user = FactoryGirl.create(:carto_user)
  end

  after(:all) do
    # This avoids connection leaking.
    ::User[@user.id].destroy
  end

  let(:auth_params) do
    { user_domain: @user.username, api_key: @user.api_key }
  end

  let(:notification) do
    { analyses: { georeference: { show: false } } }
  end

  describe '#update' do
    it 'updates the notification for the category' do
      put_json(api_v3_static_notifications_update_url('builder', auth_params), notifications: notification) do |response|
        response.status.should eq 200
        response.body.should eq ({ notifications: notification })
      end
    end

    it 'returns 403 if not authenticated' do
      put_json(api_v3_static_notifications_update_url('builder', user_domain: 'wadus'), notifications: notification) do |response|
        response.status.should eq 401
      end
    end

    it 'returns 422 with incorrect category' do
      put_json(api_v3_static_notifications_update_url('wadus', auth_params), notifications: notification) do |response|
        response.status.should eq 422
        response.body[:errors][:notifications].should include 'wadus'
      end
    end
  end
end
