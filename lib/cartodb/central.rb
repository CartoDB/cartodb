require 'typhoeus'

# encoding: utf-8
module Cartodb
  class Central

    def initialize
      @host = "http#{'s' if Rails.env.production? || Rails.env.staging?}://#{ Cartodb.config[:cartodb_central_api]['host'] }"
      @host << ":#{Cartodb.config[:cartodb_central_api]['port']}" if Cartodb.config[:cartodb_central_api]['port'].present?
      @auth = {
        username: Cartodb.config[:cartodb_central_api]['username'],
        password: Cartodb.config[:cartodb_central_api]['password']
      }

      if Cartodb.config[:cartodb_central_api]['host']
        @feature_flag_loader = CentralFeatureFlagLoader.new(self)
      else
        @feature_flag_loader = ConfigFeatureFlagLoader.new
      end
    end

    def host
      @host
    end

    def build_request(path, body, method, timeout = 200)
      Typhoeus::Request.new(
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
        raise CartoDB::CentralCommunicationFailure, "Application server responded with http #{ response.code }"
      end
    end

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
    end # update_organization_user

    def delete_organization_user(organization_name, username)
      return send_request("api/organizations/#{ organization_name }/users/#{ username }", nil, :delete, [204])
    end # delete_organization_user

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

    ############################################################################
    # Features

    def get_feature_flags(username)
      @feature_flag_loader.get_feature_flags(username)
    end

    def has_feature_flag(username, feature_flag_name)
      @feature_flag_loader.has_feature_flag(username, feature_flag_name)
    end

    private

  end

  class CentralFeatureFlagLoader
    
    def initialize(central_client)
      @central_client = central_client
    end

    def get_feature_flags(username)
      @central_client.send_request("api/users/#{username}/feature_flags", nil, :get, [200])['feature_flags']
    rescue CartoDB::CentralCommunicationFailure => exception
      []
    end

    def has_feature_flag(username, feature_flag_name)
      !@central_client.send_request("api/users/#{username}/feature_flags/#{feature_flag_name}", nil, :get, [200])['feature_flag'].nil?
    rescue CartoDB::CentralCommunicationFailure => exception
      false
    end

  end

  class ConfigFeatureFlagLoader

    def get_feature_flags(username)
      Cartodb.config[:feature_flags][username]
    rescue
      []
    end

    def has_feature_flag(username, feature_flag_name)
      get_feature_flags(username).include?(feature_flag_name)
    end

  end

end # CartodbCentral
