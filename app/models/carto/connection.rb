
module Carto
  class Connection < ActiveRecord::Base
    TYPE_OAUTH_SERVICE = 'oauth-service'.freeze
    TYPE_DB_CONNECTOR = 'db-connector'.freeze
    # id, user_id, name, type, parameters, connector, token

    # type == 'db-connector'
    #     provider = connector
    #     parameters
    # type == 'oauth-service'
    #   service = connector
    #   token / synchronization_oauth
    # type == 'url-service'
    #   service
    #   parameters (for service='arcgis' parameters: { base_url: ...})

    # there might be a type='db-connector' (future service account support) with provider = 'bigquery'
    # or a type='oauth-service' record  with service = 'bigquery'
    # (note that only token used in the latter case; no parameters as the billing project has been removed from the connection)
    belongs_to :user, class_name: 'Carto::User', inverse_of: :connections

    # TODO: serialize parameters as JSON

    validates :name, uniqueness: { scope: :user_id }

    def get_service_datasource
      raise "Invalid connection type (#{type}) to get service datasource" unless type == TYPE_OAUTH_SERVICE

      datasource = CartoDB::Datasources::DatasourcesFactory.get_datasource(service, user, {
        http_timeout: ::DataImport.http_timeout_for(user)
      })
      datasource.token = token unless datasource.nil?
      datasource
    end

    def connector
      service || provider
    end

    # TODO: replace service, provider by single field connector
    # then:
    def service
      raise "..." unless type == TYPE_OAUTH_SERVICE
      connector
    end
    def provider
      raise "..." unless type == TYPE_DB_CONNECTOR
      connector
    end

    # TODO: before_save:
    #   self.name ||= connector
    #   self.parameters = { refresh_token: token } if type == TYPE_OAUTH_SERVICE && parameters.blank?
    # this could be used as a convention for db-connectors with OAuth

  end
end
