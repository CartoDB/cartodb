module Carto
  class Connector

    class ConnectorError < StandardError
      attr_reader :user_name

      def initialize(message: 'General error', user: nil, provider: nil)
        @user_name = user && user.username
        @provider_name = provider
        message = message.to_s
        message << " User: #{@user_name}" if @user_name
        message << " Provider: #{@provider_name}" if @provider_name
        super(message)
      end

      def error_code
        CartoDB::Importer2::ERRORS_MAP.fetch(self.class, CartoDB::Importer2::ConnectorRunner::UNKNOWN_ERROR_CODE)
      end
    end

    class InvalidParametersError < ConnectorError
    end

    class NotImplemented < ConnectorError
      def initialize(message: 'Not implemented yet', user: nil, provider: nil)
        super
      end
    end

    class ConnectorsDisabledError < ConnectorError # ServiceDisabledError ?
      def initialize(message: 'CARTO-Connector disabled', user: nil, provider: nil)
        super
      end
    end
  end
end
