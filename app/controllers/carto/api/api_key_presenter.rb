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
          grants: JSON.parse(@api_key.grants_json || '[]'),
          createdAt: @api_key.created_at.to_s,
          updatedAt: @api_key.updated_at.to_s
        }
      end
    end
  end
end
