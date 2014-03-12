# encoding: utf-8

module CartoDB
  module Datasources

      class DatasourceBaseError  < StandardError

        UNKNOWN_SERVICE = 'UKNOWN'

        def initialize(message = 'General error', service = UNKNOWN_SERVICE)
          super("#{message} @ #{service}")
        end
      end

      class DownloadError         < DatasourceBaseError; end
      class AuthError             < DatasourceBaseError; end
      class ConfigurationError    < DatasourceBaseError; end
      class UninitializedError    < DatasourceBaseError; end

  end #Datasources
end #CartoDB

