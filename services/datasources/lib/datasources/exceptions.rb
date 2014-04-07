# encoding: utf-8

module CartoDB
  module Datasources

      class DatasourceBaseError  < StandardError

        UNKNOWN_SERVICE = 'UKNOWN'

        def initialize(message = 'General error', service = UNKNOWN_SERVICE)
          super("#{message} @ #{service}")
        end #initialize
      end #DatasourceBaseError

      class AuthError                   < DatasourceBaseError; end
      class InvalidServiceError         < DatasourceBaseError; end
      class DataDownloadError           < DatasourceBaseError; end
      class MissingConfigurationError   < DatasourceBaseError; end
      class UninitializedError          < DatasourceBaseError; end

  end #Datasources
end #CartoDB