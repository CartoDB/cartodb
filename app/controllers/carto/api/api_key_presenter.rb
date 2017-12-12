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
          id: @api_key.id,
          user: @api_key.user.username,
          type: @api_key.type,
          token: @api_key.token,
          grants: @api_key.grants_hash,
          databaseConfig: {
            role: @api_key.db_role,
            password: @api_key.db_password
          },
          createdAt: @api_key.created_at.to_s,
          updatedAt: @api_key.updated_at.to_s
        }
      end
    end
  end
end
