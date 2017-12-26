# encoding: utf-8

require_relative 'connector/fdw_support'
require_relative 'connector/errors'
require_relative 'connector/providers'
require_relative 'connector/parameters'
require_relative 'connector/context'

module Carto
  # This class provides remote database connection services based on FDW
  class Connector

    attr_reader :provider_name

    def initialize(parameters, context)
      @connector_context = Context.cast(context)

      @params = Parameters.new(parameters)

      @provider_name = @params[:provider]
      @provider_name ||= DEFAULT_PROVIDER

      raise InvalidParametersError.new(message: "Provider not defined") if @provider_name.blank?
      @provider = Connector.provider_class(@provider_name).try :new, @connector_context, @params
      raise InvalidParametersError.new(message: "Invalid provider", provider: @provider_name) if @provider.blank?
    end

    def copy_table(schema_name:, table_name:)
      @provider.copy_table(schema_name: schema_name, table_name: table_name, limits: limits)
    end

    def self.list_tables?(provider)
      information = Connector.information(provider)
      information[:features][:list_tables]
    end

    def list_tables(limit = nil)
      @provider.list_tables(limits: limits.merge(max_listed_tables: limit))
    end

    def check_connection
      @provider.check_connection
    end

    def remote_data_updated?
      @provider.remote_data_updated?
    end

    def remote_table_name
      @provider.table_name
    end

    # General availabillity check
    def self.check_availability!(user)
      unless user.has_feature_flag?('carto-connectors')
        raise ConnectorsDisabledError.new(user: user)
      end
    end

    def self.available?(user)
      user.has_feature_flag?('carto-connectors')
    end

    # Check availability for a user and provider
    def check_availability!
      Connector.check_availability!(@connector_context.user)
      if !enabled?
        raise ConnectorsDisabledError.new(user: @connector_context.user, provider: @provider_name)
      end
    end

    # Limits for the user/provider
    def limits
      Connector.limits provider_name: @provider_name, user: @connector_context.user
    end

    # Availability for the user/provider
    def enabled?
      limits[:enabled]
    end

    def self.limits(provider_name:, user:)
      if configuration = user.connector_configuration(provider_name)
        { enabled: configuration.enabled?, max_rows: configuration.max_rows }
      else
        {}
      end
    end

    # Information about a connector's features and parameters.
    #
    # Example:
    # {
    #   'mysql' => {
    #     features: {
    #                 "sql_queries":    true,
    #                 "list_databases": false,
    #                 "list_tables":    true,
    #                 "preview_table":  false
    #     },
    #     parameters: {
    #       connection: {
    #         server: { required: true, description: "..." },
    #         ...
    #       },
    #       table: { required: true, description: "..." },
    #       ...
    #     }
    #   }, ...
    # }
    def self.information(provider_name)
      provider = provider_class(provider_name)
      raise InvalidParametersError.new(message: "Invalid provider", provider: provider_name) if provider.blank?
      provider.information
    end

    # Available providers information.
    #
    # Example:
    # {
    #   'mysql' => { name: 'MySQL', description: '...', enabled: true },
    #   ...
    # }
    #
    # By default only `public` providers are returned; use `all: true` to return all of them.
    # If a `user:` argument is provided, the  `enabled` key will indicate if the provider is
    # enabled for the user; otherwise it indicates if it is enabled by default.
    #
    def self.providers(user: nil, all: false)
      providers_info = {}
      provider_ids.each do |id|
        next unless all || provider_public?(id)
        # TODO: load description template for provider id
        description = nil
        enabled = if user
                    Connector.limits(user: user, provider_name: id)[:enabled]
                  else
                    provider = ConnectorProvider.find_by_name(id)
                    ConnectorConfiguration.default(provider).enabled if provider
                  end
        providers_info[id] = {
          name:        provider_name(id),
          description: description,
          enabled:     enabled
        }
      end
      providers_info
    end

    private

    # Validate parameters.
    # An array of parameter names to validate can be passed via :only.
    # By default all parameters are validated
    def validate!(only: nil)
      @provider.validate!(only: only)
    end

    def log(message, truncate = true)
      @connector_context.log message, truncate
    end
  end
end
