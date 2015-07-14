# encoding: utf-8

module CartoDB
  module Datasources
    class BaseOAuth < Base

      # At least for CartoDB SaaS, this will be parsed by oauth endpoint to rewrite the url, so must be filled with
      # e.g. CALLBACK_STATE_DATA_PLACEHOLDER.sub('user', @user.username).sub('service', DATASOURCE_NAME)
      # And appended anywhere in the querystring used as callback url with param "state=xxxxxx"
      CALLBACK_STATE_DATA_PLACEHOLDER = '__user__service__'

      # TODO: Helper method to aid with migration of endpoints, can be removed after full AR migration
      def service_name_for_user(service_name, user)
        service_name
      end

      # Return the url to be displayed or sent the user to to authenticate and get authorization code
      # @param use_callback_flow : bool
      def get_auth_url(use_callback_flow=true)
        raise 'To be implemented in child classes'
      end #get_auth_url

      # Validate authorization code and store token
      # @param auth_code : string
      # @return string : Access token
      def validate_auth_code(auth_code)
        raise 'To be implemented in child classes'
      end #validate_auth_code

      # Validates the authorization callback
      # @param params : mixed
      def validate_callback(params)
        raise 'To be implemented in child classes'
      end #validate_callback

      # Set token
      # @param token string
      def token=(token)
        raise 'To be implemented in child classes'
      end #token=

      # Retrieve token
      # @return string | nil
      def token
        raise 'To be implemented in child classes'
      end #token

      # Checks if token is still valid or has been revoked
      # @return bool
      def token_valid?
        raise 'To be implemented in child classes'
      end #token_valid?

      # Revokes current set token
      def revoke_token
        raise 'To be implemented in child classes'
      end #revoke_token

      private_class_method :new

    end
  end
end
