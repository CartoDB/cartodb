require 'json'

module Carto
  module Api
    class ApiKeyGrantsPresenter
      def initialize(api_key_grants)
        @api_key_grants = api_key_grants
      end

      def to_poro
        return [] unless @api_key_grants
        [
          {
            type: 'apis',
            apis: @api_key_grants.granted_apis
          },
          {
            type: 'database',
            tables: @api_key_grants.table_permissions(from_db: true).map do |p|
              {
                schema: p.schema,
                name: p.name,
                permissions: p.permissions
              }
            end
          }
        ]
      end
    end

    class ApiKeyPresenter
      def initialize(api_key)
        @api_key = api_key
      end

      def to_poro
        return {} unless @api_key
        grants_presenter = ApiKeyGrantsPresenter.new(@api_key.api_key_grants)
        {
          id: @api_key.id,
          user: { username: @api_key.user.username },
          type: @api_key.type,
          name: @api_key.name,
          token: @api_key.token,
          grants: grants_presenter.to_poro,
          createdAt: @api_key.created_at.to_s,
          updatedAt: @api_key.updated_at.to_s
        }
      end
    end
  end
end
