# encoding: utf-8

module CartoDB
  module Datasources
    class BaseOAuth < Base

      # Return the url to be displayed or sent the user to to authenticate and get authorization code
      def get_auth_url
        raise 'To be implemented in child classes'
      end #get_auth_url

      # Validate authorization code and store token
      # @param auth_code : string
      # @return string : Access token
      def validate_auth_code(auth_code)
        raise 'To be implemented in child classes'
      end #validate_auth_code

      # Store token
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

      private_class_method :new

    end #Base
  end #Datasources
end #CartoDB
