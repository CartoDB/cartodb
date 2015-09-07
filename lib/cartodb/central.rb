require_relative '../carto/http/client'

# encoding: utf-8
module Cartodb
  class Central

    def self.sync_data_with_cartodb_central?
      Cartodb.config[:cartodb_central_api].present? && Cartodb.config[:cartodb_central_api]['username'].present? && Cartodb.config[:cartodb_central_api]['password'].present?
    end

    def initialize
      @host = "http#{'s' if Rails.env.production? || Rails.env.staging?}://#{ Cartodb.config[:cartodb_central_api]['host'] }"
      @host << ":#{Cartodb.config[:cartodb_central_api]['port']}" if Cartodb.config[:cartodb_central_api]['port'].present?
      @auth = {
        username: Cartodb.config[:cartodb_central_api]['username'],
        password: Cartodb.config[:cartodb_central_api]['password']
      }
    end

    def host
      @host
    end

    def google_signup_url
      "#{self.host}/google/signup"
    end

    def build_request(path, body, method, timeout = 200)
      http_client = Carto::Http::Client.get('central', log_requests: true)
      http_client.request(
        "#{ @host }/#{ path }",
        method: method,
        body: body.to_json,
        userpwd: "#{ @auth[:username] }:#{ @auth[:password] }",
        headers: { "Content-Type" => "application/json" },
        ssl_verifypeer: Rails.env.production?,
        timeout: timeout
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
      return send_request("api/users/#{username_or_email}", nil, :get, [200,404])
    end # get_organization_users

    def get_organization_users(organization_name)
      return send_request("api/organizations/#{ organization_name }/users", nil, :get, [200], 600)
    end # get_organization_users

    def get_organization_user(organization_name, username)
      return send_request("api/organizations/#{ organization_name }/users/#{ username }", nil, :get, [200])
    end # get_organization_user

    def create_organization_user(organization_name, user_attributes)
      body = {user: user_attributes}
      return send_request("api/organizations/#{ organization_name }/users", body, :post, [201])
    end # create_organization_user

    def update_organization_user(organization_name, username, user_attributes)
      body = {user: user_attributes}
      return send_request("api/organizations/#{ organization_name }/users/#{ username }", body, :put, [204])
    end

    def delete_organization_user(organization_name, username)
      return send_request("api/organizations/#{ organization_name }/users/#{ username }", nil, :delete, [204])
    end # delete_organization_user

    def update_user(username, user_attributes)
      body = {user: user_attributes}
      return send_request("api/users/#{username}", body, :put, [204])
    end

    def delete_user(username)
      return send_request("api/users/#{username}", nil, :delete, [204])
    end

    ############################################################################
    # Organizations

    def get_organizations
      return send_request("api/organizations", nil, :get, [200], 600)
    end # get_organizations

    def get_organization(organization_name)
      return send_request("api/organizations/#{ organization_name }", nil, :get, [200])
    end # get_organization

    # Returns remote organization attributes if response code is 201
    # otherwise returns nil
    # luisico asks: Not sure why organization_name is passed to this method. It's not used
    # rilla answers: That's right, but this methods is just a stub: org creation from the editor is still unsupported
    def create_organization(organization_name, organization_attributes)
      body = {organization: organization_attributes}
      return send_request("api/organizations", body, :post, [201])
    end # create_organization

    def update_organization(organization_name, organization_attributes)
      body = {organization: organization_attributes}
      return send_request("api/organizations/#{ organization_name }", body, :put, [204])
    end # update_organization

    def delete_organization(organization_name)
      return send_request("api/organizations/#{ organization_name }", nil, :delete, [204])
    end # delete_organization

  end

end
