require 'spec_helper_min'
require 'support/helpers'

module Carto
  describe Api::OrganizationNotificationsController do
    include HelperMethods

    before(:all) do
      @sequel_organization = FactoryGirl.create(:organization_with_users)
      @organization = Carto::Organization.find(@sequel_organization.id)
      @owner = @organization.owner
      @user = @organization.users.reject { |u| u.id == @organization.owner_id }.first
    end

    after(:all) do
      @organization.destroy
    end

    shared_examples_for 'requires owner authentication' do
      it 'returns 403 if organization does not exists' do
        request('abc', @owner) do
          expect(response.status).to eq 404
        end
      end

      it 'returns 403 if user is not the owner of the organization' do
        request(@owner.api_key, @user) do
          expect(response.status).to eq 403
        end
      end
    end

    describe '#create' do
      let(:valid_payload) do
        {
          organization_id: @organization.id,
          icon: Carto::Notification::ICON_ALERT,
          recipients: 'builders',
          body: 'wadus'
        }
      end

      before(:each) do
        @organization.notifications.each(&:destroy)
      end

      def create_notification_request(org_id, user, payload)
        options = { organization_id: org_id, user_domain: user.username, api_key: user.api_key }
        post_json(organization_notifications_url(options), notification: payload) { |response| yield response }
      end

      it_behaves_like 'requires owner authentication' do
        def request(org_id, user)
          create_notification_request(org_id, user, valid_payload) { |response| yield response }
        end
      end

      it 'creates a notification' do
        create_notification_request(@organization.id, @owner, valid_payload) do |response|
          expect(response.status).to eq 201
          notification = Notification.find(response.body[:id])

          expect(notification.organization_id).to eq valid_payload[:organization_id]
          expect(notification.icon).to eq valid_payload[:icon]
          expect(notification.recipients).to eq valid_payload[:recipients]
          expect(notification.body).to eq valid_payload[:body]
        end
      end

      it 'displays validations errors' do
        create_notification_request(@organization.id, @owner, {}) do |response|
          expect(response.status).to eq 422
          expect(@organization.notifications).to be_empty

          expect(response.body).to include :errors
          expect(response.body[:errors]).to include(:body, :recipients, :icon)
        end
      end
    end

    describe '#destroy' do
      before(:each) do
        @organization.notifications.each(&:destroy)
        @notification = @organization.notifications.create!(body: 'a', recipients: 'builders',
                                                            icon: Carto::Notification::ICON_ALERT)
      end

      def destroy_notification_request(org_id, user, notification_id)
        options = { organization_id: org_id, user_domain: user.username, api_key: user.api_key, id: notification_id }
        delete_json(organization_notification_url(options)) { |response| yield response }
      end

      it_behaves_like 'requires owner authentication' do
        def request(org_id, user)
          destroy_notification_request(org_id, user, @notification.id) { |response| yield response }
        end
      end

      it 'destroys a notification' do
        destroy_notification_request(@organization.id, @owner, @notification.id) do |response|
          expect(response.status).to eq 204
          expect(Notification.exists?(@notification.id)).to be_false
        end
      end

      it 'returns 404 if notification is not found' do
        destroy_notification_request(@organization.id, @owner, UUIDTools::UUID.random_create) do |response|
          expect(response.status).to eq 404
          expect(Notification.exists?(@notification.id)).to be_true
        end
      end
    end
  end
end
