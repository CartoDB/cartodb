# encoding: utf-8
require_relative './url/arcgis'
require_relative './url/dropbox'
require_relative './url/box'
require_relative './url/gdrive'
require_relative './url/instagram_oauth'
require_relative './url/mailchimp'
require_relative './url/public_url'
require_relative 'search/twitter'

module CartoDB
  module Datasources
      class DatasourcesFactory
        NAME = 'DatasourcesFactory'.freeze

        # in seconds
        HTTP_CONNECT_TIMEOUT = 60
        DEFAULT_HTTP_REQUEST_TIMEOUT = 600

        # Retrieve a datasource instance
        # @param datasource_name string
        # @param user ::User
        # @param additional_config Hash
        # {
        #   :redis_storage => Redis|nil
        #   :ogr2ogr_instance => Ogr2ogr|nil
        # }
        # @return mixed
        # @throws MissingConfigurationError
        def self.get_datasource(datasource_name, user, additional_config = {})
          if additional_config[:http_timeout].nil?
            additional_config[:http_timeout] = DEFAULT_HTTP_REQUEST_TIMEOUT
          end
          if additional_config[:http_connect_timeout].nil?
            additional_config[:http_connect_timeout] = HTTP_CONNECT_TIMEOUT
          end

          case datasource_name
            when Url::Dropbox::DATASOURCE_NAME
              Url::Dropbox.get_new(DatasourcesFactory.config_for(datasource_name, user), user)
            when Url::Box::DATASOURCE_NAME
              Url::Box.get_new(DatasourcesFactory.config_for(datasource_name, user), user)
            when Url::GDrive::DATASOURCE_NAME
              Url::GDrive.get_new(DatasourcesFactory.config_for(datasource_name, user), user)
            when Url::InstagramOAuth::DATASOURCE_NAME
              Url::InstagramOAuth.get_new(DatasourcesFactory.config_for(datasource_name, user), user)
            when Url::PublicUrl::DATASOURCE_NAME
              Url::PublicUrl.get_new(additional_config)
            when Url::ArcGIS::DATASOURCE_NAME
              Url::ArcGIS.get_new(user)
            when Url::MailChimp::DATASOURCE_NAME
              Url::MailChimp.get_new(DatasourcesFactory.config_for(datasource_name, user).merge(additional_config), user)
            when Search::Twitter::DATASOURCE_NAME
              Search::Twitter.get_new(DatasourcesFactory.config_for(datasource_name, user), user,
                                      additional_config[:redis_storage], additional_config[:user_defined_limits])
            when nil
              nil
            else
              raise MissingConfigurationError.new("unrecognized datasource #{datasource_name}", NAME)
          end
        end

        # Gets all available oauth datasources
        def self.get_all_oauth_datasources
          [
            Url::Dropbox::DATASOURCE_NAME,
            Url::Box::DATASOURCE_NAME,
            Url::GDrive::DATASOURCE_NAME,
            # Url::InstagramOAuth::DATASOURCE_NAME,
            Url::MailChimp::DATASOURCE_NAME
          ]
        end

        # Gets the config of a certain datasource
        # @param datasource_name string
        # @param user ::User
        # @return string
        # @throws MissingConfigurationError
        def self.config_for(datasource_name, user)
          config, datasource_supports_custom_config = get_config(datasource_name)

          if datasource_supports_custom_config
            key = customized_config_key(config, datasource_name, user)

            if key.nil?
              config[datasource_name][:standard.to_s]
            else
              # This code assumes config is ok
              name_config_map = config[datasource_name]['entity_to_config_map'].select { |u| !u[key].nil? }.first
              config[datasource_name][:customized.to_s][name_config_map[key]]
            end
          else
            config.fetch(datasource_name)
          end
        end

        def self.customized_config?(datasource_name, user)
          config, datasource_supports_custom_config = get_config(datasource_name)
          datasource_supports_custom_config && customized_config_key(config, datasource_name, user).present?
        end

        # Allows to set a custom config (useful for testing)
        # @param custom_config string
        def self.set_config(custom_config)
          @forced_config = custom_config
        end

        def self.get_config(datasource_name)
          config_source = @forced_config ? @forced_config : Cartodb.config

          datasource_supports_custom_config = false

          case datasource_name
          when Url::Dropbox::DATASOURCE_NAME, Url::Box::DATASOURCE_NAME, Url::GDrive::DATASOURCE_NAME, Url::InstagramOAuth::DATASOURCE_NAME,
              Url::MailChimp::DATASOURCE_NAME
            config = (config_source[:oauth] rescue nil)
            config ||= (config_source[:oauth.to_s] rescue nil)
          when Search::Twitter::DATASOURCE_NAME
            config = (config_source[:datasource_search] rescue nil)
            config ||= (config_source[:datasource_search.to_s] rescue nil)
            datasource_supports_custom_config = true
          else
            config = nil
          end

          if config.nil? || config.empty?
            raise MissingConfigurationError.new("missing configuration for datasource #{datasource_name}", NAME)
          end

          [config, datasource_supports_custom_config]
        end
        private_class_method :get_config

        def self.customized_config_key(config, datasource_name, user)
          custom_config_orgs = config[datasource_name].fetch(:customized_orgs_list.to_s, [])
          custom_config_users = config[datasource_name][:customized_user_list.to_s]

          if user.organization_user? && custom_config_orgs.include?(user.organization.name)
            user.organization.name
          elsif custom_config_users.include?(user.username)
            user.username
          end
        end
        private_class_method :customized_config_key
      end
  end
end

