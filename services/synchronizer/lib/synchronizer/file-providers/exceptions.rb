# encoding: utf-8

module CartoDB
  module Synchronizer
    module FileProviders

      class SynchonizerBaseError  < StandardError
        def initialize(message = 'General error', service = 'UKNOWN')
          super("#{message} @ #{service}")
        end
      end

      class DownloadError         < SynchonizerBaseError; end
      class AuthError             < SynchonizerBaseError; end
      class ConfigurationError    < SynchonizerBaseError; end
      class UninitializedError    < SynchonizerBaseError; end

    end #FileProviders
  end #Synchronizer
end #CartoDB

