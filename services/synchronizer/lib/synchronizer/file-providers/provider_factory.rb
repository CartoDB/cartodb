# encoding: utf-8

require_relative './dropbox_provider'
require_relative './gdrive_provider'
require_relative './public_url_provider'

module CartoDB
  module Synchronizer
    module FileProviders
      class ProviderFactory

        NAME = 'ProviderFactory'

        # Retrieve a provider instance
        # @param provider_name : string
        # @return BaseProvider Or any of its derived classes
        # @throws ConfigurationError
        def self.get_provider(provider_name)
          case provider_name
            when DropboxProvider::SERVICE
              DropboxProvider.get_new(ProviderFactory.config_for_provider(provider_name))
            when GDriveProvider::SERVICE
              GDriveProvider.get_new(ProviderFactory.config_for_provider(provider_name))
            when PublicUrlProvider::SERVICE
              PublicUrlProvider.get_new()
            else
              raise ConfigurationError.new("unrecognized provider #{provider_name}", NAME)
          end
        end #self.get_provider

        # Gets the config of a certain provider
        # @param provider_name : string
        # @return string
        # @throws ConfigurationError
        def self.config_for_provider(provider_name)
          # Cartodb::config[:assets]["max_file_size"]
          @config ||= (CartoDB::config[:oauth] rescue [])
          raise ConfigurationError.new("missing configuration for provider #{provider_name}", NAME) if @config.empty?
          @config.fetch(provider_name)
        end #self.config_for_provider

        # Allows to set a custom config (useful for testing)
        # @param custom_config : string
        def self.set_providers_config(custom_config)
          @config = custom_config
        end #self.set_providers_config

      end # ProviderFactory
    end #FileProviders
  end #Syncronizer
end #CartoDB

