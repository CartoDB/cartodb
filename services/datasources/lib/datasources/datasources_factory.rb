# encoding: utf-8

module CartoDB
  module Datasources
      class DatasourcesFactory

        NAME = 'DatasourcesFactory'

        # Retrieve a datasource instance
        # @param datasource_name string
        # @param user User
        # @param redis Redis|nil (optional)
        # @return mixed
        # @throws MissingConfigurationError
        def self.get_datasource(datasource_name, user, redis_storage = nil)
          case datasource_name
            when Url::Dropbox::DATASOURCE_NAME
              Url::Dropbox.get_new(DatasourcesFactory.config_for(datasource_name, user), user)
            when Url::GDrive::DATASOURCE_NAME
              Url::GDrive.get_new(DatasourcesFactory.config_for(datasource_name, user), user)
            when Url::PublicUrl::DATASOURCE_NAME
              Url::PublicUrl.get_new()
            when Search::Twitter::DATASOURCE_NAME
              Search::Twitter.get_new(DatasourcesFactory.config_for(datasource_name, user), user, redis_storage)
            when nil
              nil
            else
              raise MissingConfigurationError.new("unrecognized datasource #{datasource_name}", NAME)
          end
        end

        # Gets the config of a certain datasource
        # @param datasource_name string
        # @param user User
        # @return string
        # @throws MissingConfigurationError
        def self.config_for(datasource_name, user)
          config_source = @forced_config ? @forced_config : Cartodb.config

          includes_customized_config = false

          case datasource_name
            when Url::Dropbox::DATASOURCE_NAME, Url::GDrive::DATASOURCE_NAME
              config = (config_source[:oauth] rescue nil)
              config ||= (config_source[:oauth.to_s] rescue nil)
            when Search::Twitter::DATASOURCE_NAME
              config = (config_source[:datasource_search] rescue nil)
              config ||= (config_source[:datasource_search.to_s] rescue nil)
              includes_customized_config = true
            else
              config = nil
          end

          if config.nil? || config.empty?
            raise MissingConfigurationError.new("missing configuration for datasource #{datasource_name}", NAME)
          end

          if includes_customized_config
            custom_config_users = config[datasource_name][:customized_user_list.to_s]
            if custom_config_users.include?(user.username)
              config[datasource_name][:customized.to_s]
            else
              config[datasource_name][:standard.to_s]
            end
          else
            config.fetch(datasource_name)
          end
        end

        # Allows to set a custom config (useful for testing)
        # @param custom_config string
        def self.set_config(custom_config)
          @forced_config = custom_config
        end

      end
  end
end

