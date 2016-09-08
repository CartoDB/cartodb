module CartoDB
  module Importer2
    class Connector

      class ConnectorError < StandardError
        attr_reader :user_name

        def initialize(message = 'General error', user = nil)
          @user_name = user && user.username
          message = message.to_s
          message << " User: #{@user_name}" if @user_name
          super(message)
        end

        def error_code
          ERRORS_MAP.fetch(self.class, UNKNOWN_ERROR_CODE)
        end
      end

      class InvalidParametersError < ConnectorError
      end

      class ConnectorsDisabledError < ConnectorError # ServiceDisabledError ?
        def initialize(message = 'CARTO-Connectors disabled', user = nil)
          super message: message, user: user
        end
      end
    end
  end
end
