require 'json'

module Carto
  module Api
    class ApiKeyPresenter
      def initialize(api_key)
        @api_key = api_key
      end

      def to_poro
        return {} unless @api_key

        {
          name: @api_key.name,
          user: { username: @api_key.user.username },
          type: @api_key.type,
          token: @api_key.token,
          grants: get_grants,
          created_at: @api_key.created_at.to_s,
          updated_at: @api_key.updated_at.to_s
        }
      end

      private

      def get_grants
        grants = [
          {
            type: 'apis',
            apis: @api_key.granted_apis
          }
        ]

        type_database = {
          type: 'database',
          tables: table_permissions_for_api_key,
          schemas: schema_permissions_for_api_key
        }

        if @api_key.dataset_metadata_permissions
          type_database['table_metadata'] = []
        end

        grants << type_database

        if @api_key.data_services?
          grants << {
            type: 'dataservices',
            services: @api_key.data_services
          }
        end

        if @api_key.data_observatory_datasets?
          grants << {
            type: 'data-observatory',
            datasets: @api_key.data_observatory_datasets
          }
        end

        grants
      end

      def table_permissions_for_api_key
        return [] if @api_key.master? || @api_key.default_public?

        @api_key.table_permissions_from_db.map do |p|
          {
            schema: p.schema,
            name: p.name,
            owner: p.owner,
            permissions: p.permissions
          }
        end
      end

      def schema_permissions_for_api_key
        return [] if @api_key.master? || @api_key.default_public?

        @api_key.schema_permissions_from_db.map do |p|
          {
            name: p.name,
            permissions: p.permissions
          }
        end
      end
    end
  end
end
