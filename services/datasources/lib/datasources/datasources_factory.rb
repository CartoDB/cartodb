# encoding: utf-8

module CartoDB
  module Datasources
      class DatasourcesFactory

        NAME = 'DatasourcesFactory'

        # Retrieve a datasource instance
        # @param datasource_name string
        # @param user User
        # @return mixed
        # @throws ConfigurationError
        def self.get_datasource(datasource_name, user)
          case datasource_name
            when Url::Dropbox::DATASOURCE_NAME
              Url::Dropbox.get_new(DatasourcesFactory.config_for(datasource_name), user)
            when Url::GDrive::DATASOURCE_NAME
              Url::GDrive.get_new(DatasourcesFactory.config_for(datasource_name), user)
            when Url::PublicUrl::DATASOURCE_NAME
              Url::PublicUrl.get_new()
            when nil
              nil
            else
              raise ConfigurationError.new("unrecognized datasource #{datasource_name}", NAME)
          end
        end #self.get_datasource

        # Gets the config of a certain datasource
        # @param datasource_name string
        # @return string
        # @throws ConfigurationError
        def self.config_for(datasource_name)
          # Cartodb::config[:assets]["max_file_size"]
          @config ||= (Cartodb.config[:oauth] rescue [])
          raise ConfigurationError.new("missing configuration for datasource #{datasource_name}", NAME) if @config.empty?
          @config.fetch(datasource_name)
        end #self.config_for

        # Allows to set a custom config (useful for testing)
        # @param custom_config string
        def self.set_config(custom_config)
          @config = custom_config
        end #self.set_config

      end # ProviderFactory
  end #Syncronizer
end #CartoDB

