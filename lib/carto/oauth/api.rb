module Carto
  module Oauth
    class Api

      include ::LoggerHelper

      attr_reader :config, :access_token

      def self.with_code(config, code)
        token = config.client.exchange_code_for_token(code)
        raise 'Could not initialize Oauth API' unless token
        new(config, token)
      end

      def initialize(config, token)
        @config = config
        @access_token = token
      end

      def user_params
        raise 'Subclass must override user_params'
      end

      def user
        raise 'Subclass must override user'
      end

      def hidden_fields
        raise 'Subclass must override hidden_fields'
      end

      def student?
        raise 'Subclass must override student?'
      end

      private

      def log_context
        super.merge(current_user: user)
      end
    end
  end
end
