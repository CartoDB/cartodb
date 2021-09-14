require_relative '../carto/http/client'
require './app/helpers/message_broker_helper'

module Cartodb
  class Central

    include ::MessageBrokerHelper

    def self.message_broker_sync_enabled?
      Cartodb.get_config(:message_broker, 'project_id').present? &&
        Cartodb.get_config(:message_broker, 'central_subscription_name').present?
    end

    def self.message_broker_sync_disabled?
      !message_broker_sync_enabled?
    end

    def self.api_sync_enabled?
      Cartodb.get_config(:cartodb_central_api, 'username').present? &&
        Cartodb.get_config(:cartodb_central_api, 'password').present?
    end

    def self.api_sync_disabled?
      !api_sync_enabled?
    end

    class << self
      alias login_redirection_enabled? api_sync_enabled?
    end

    def initialize
      config_host = Cartodb.get_config(:cartodb_central_api, 'host')
      config_port = Cartodb.get_config(:cartodb_central_api, 'port')
      @host = "http#{'s' if Rails.env.production? || Rails.env.staging?}://#{config_host}"
      @host << ":#{config_port}" if config_port.present?
      @auth = {
        username: Cartodb.get_config(:cartodb_central_api, 'username'),
        password: Cartodb.get_config(:cartodb_central_api, 'password')
      }
    end

    def host
      @host
    end

    def google_signup_url
      "#{host}/google/signup"
    end

    def login_url
      URI.join(host, 'login').to_s
    end

    def unverified_url
      URI.join(host, 'unverified').to_s
    end

    def build_request(path, body, method, timeout = 200)
      http_client = Carto::Http::Client.get('central', log_requests: true)
      http_client.request(
        "#{@host}/#{path}",
        method: method,
        body: body.nil? ? nil: body.to_json,
        userpwd: "#{@auth[:username]}:#{@auth[:password]}",
        headers: { "Content-Type" => "application/json" },
        ssl_verifypeer: Rails.env.production?,
        timeout: timeout,
        followlocation: true
      )
    end

    def send_request(path, body, method, expected_codes, timeout = nil)
      request = build_request(path, body, method, timeout)
      response = request.run
      if expected_codes.include?(response.code)
        return response.body && response.body.length >= 2 ? JSON.parse(response.body) : {}
      else
        raise CartoDB::CentralCommunicationFailure.new(response)
      end
    end

    def get_user(username_or_email)
      send_request("api/users/#{username_or_email}", nil, :get, [200, 404])
    end

    def get_organization_users(organization_name)
      send_request("api/organizations/#{ organization_name }/users", nil, :get, [200], 600)
    end

    def get_organization_user(organization_name, username)
      send_request("api/organizations/#{ organization_name }/users/#{ username }", nil, :get, [200])
    end

    def validate_new_organization_user(username:, email:)
      send_request(
        'api/organizations/users/validate_new',
        { user: { username: username, email: email } },
        :post,
        [200, 400]
      )
    end

    def create_organization_user(organization_name, user_attributes)
      payload = {
        organization_name: organization_name
      }.merge(user_attributes)
      cartodb_central_topic.publish(:create_org_user, payload)
    end

    def update_organization_user(organization_name, username, user_attributes)
      payload = {
        organization_name: organization_name,
        username: username
      }.merge(user_attributes)
      cartodb_central_topic.publish(:update_org_user, payload)
    end

    def delete_organization_user(organization_name, username)
      payload = {
        organization_name: organization_name,
        username: username
      }
      cartodb_central_topic.publish(:delete_org_user, payload)
    end

    def update_user(username, user_attributes)
      payload = {
        username: username
      }.merge(user_attributes)
      cartodb_central_topic.publish(:update_user, payload)
    end

    def delete_user(username)
      remote_data = Carto::User.where(username: username).first
      payload = {
        username: username,
        remote_data: remote_data
      }
      cartodb_central_topic.publish(:delete_user, payload)
    end

    def check_do_enabled(username)
      send_request("api/users/#{username}/do_status", nil, :get, [200])
    end

    def get_do_token(username)
      send_request("api/users/#{username}/do_token", nil, :get, [200])
    end

    def create_do_datasets(username:, datasets:)
      body = { datasets: datasets }
      send_request("api/users/#{username}/do/datasets", body, :post, [201])
    end

    def update_do_subscription(username:, subscription_id:, subscription_params:)
      body = { subscription_params: subscription_params }
      send_request("api/users/#{username}/do/datasets/#{subscription_id}", body, :put, [204])
    end

    def remove_do_dataset(username:, id:)
      send_request("api/users/#{username}/do/datasets/#{id}", nil, :delete, [204])
    end

    ############################################################################
    # Organizations

    def get_organizations
      send_request("api/organizations", nil, :get, [200], 600)
    end

    def get_organization(organization_name)
      send_request("api/organizations/#{ organization_name }", nil, :get, [200])
    end

    ############################################################################
    # Mobile apps

    def get_mobile_apps(username)
      send_request("api/users/#{username}/mobile_apps", nil, :get, [200])
    end

    def get_mobile_app(username, app_id)
      send_request("api/users/#{username}/mobile_apps/#{app_id}", nil, :get, [200])
    end

    def create_mobile_app(username, mobile_app_attributes)
      body = { mobile_app: mobile_app_attributes }
      send_request("api/users/#{username}/mobile_apps", body, :post, [201])
    end

    def update_mobile_app(username, app_id, mobile_app_attributes)
      body = { mobile_app: mobile_app_attributes }
      send_request("api/users/#{username}/mobile_apps/#{app_id}", body, :put, [204])
    end

    def delete_mobile_app(username, app_id)
      send_request("api/users/#{username}/mobile_apps/#{app_id}", nil, :delete, [204])
    end

    ############################################################################
    # OAuth apps

    def create_oauth_app(username, oauth_app_attributes)
      body = { oauth_app: oauth_app_attributes }
      send_request("api/users/#{username}/oauth_apps", body, :post, [201])
    end

    def update_oauth_app(username, app_id, oauth_app_attributes)
      body = { oauth_app: oauth_app_attributes }
      send_request("api/users/#{username}/oauth_apps/#{app_id}", body, :put, [204])
    end

    def delete_oauth_app(username, app_id)
      send_request("api/users/#{username}/oauth_apps/#{app_id}", nil, :delete, [204])
    end

  end
end
