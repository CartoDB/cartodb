require 'spec_helper_min'
require 'support/helpers'

module Carto
  describe Api::ReceivedNotificationsController do
    include HelperMethods

    before(:all) do
      @user = FactoryGirl.create(:carto_user)
      @notification = FactoryGirl.create(:notification)
    end

    after(:all) do
      @user.destroy
    end

    describe '#update' do
      before(:each) do
        @user.received_notifications.each(&:destroy)
        @received_notification = @user.received_notifications.create!(notification: @notification,
                                                                      received_at: DateTime.now)
      end

      let(:url_options) do
        {
          user_id: @user.id,
          id: @received_notification.id,
          user_domain: @user.username,
          api_key: @user.api_key
        }
      end

      it 'marks a notification as read' do
        put_json(user_notification_url(url_options), notification: { read_at: '2017-01-01' }) do |response|
          expect(response.status).to eq 200
          expect(response.body[:read_at]).to be

          @received_notification.reload
          expect(@received_notification.read_at).not_to be_nil
        end
      end

      it 'returns 422 for invalid dates' do
        put_json(user_notification_url(url_options), notification: { read_at: 'wadus ' }) do |response|
          expect(response.status).to eq 422
          expect(response.body[:errors]).to include :read_at

          @received_notification.reload
          expect(@received_notification.read_at).to be_nil
        end
      end

      it 'returns 404 if notification not found' do
        invalid_options = url_options.merge(id: UUIDTools::UUID.random_create)
        put_json(user_notification_url(invalid_options), notification: { read_at: 'wadus ' }) do |response|
          expect(response.status).to eq 404
        end
      end

      it 'returns 403 if not not logged in as user' do
        invalid_options = url_options.merge(user_id: UUIDTools::UUID.random_create)
        put_json(user_notification_url(invalid_options), notification: { read_at: 'wadus ' }) do |response|
          expect(response.status).to eq 403
        end
      end

      it 'returns 401 if not not logged in' do
        invalid_options = url_options.merge(api_key: 'not_valid')
        put_json(user_notification_url(invalid_options), notification: { read_at: 'wadus ' }) do |response|
          expect(response.status).to eq 401
        end
      end
    end
  end
end
