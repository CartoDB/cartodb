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
          grants: [
            {
              type: 'apis',
              apis: @api_key.granted_apis
            },
            {
              type: 'database',
              tables: @api_key.table_permissions_from_db.map do |p|
                {
                  schema: p.schema,
                  name: p.name,
                  permissions: p.permissions
                }
              end
            }
          ],
          createdAt: @api_key.created_at.to_s,
          updatedAt: @api_key.updated_at.to_s
        }
      end
    end
  end
end
