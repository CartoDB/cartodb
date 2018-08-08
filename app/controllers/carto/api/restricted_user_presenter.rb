module Carto
  module Api
    class RestrictedUserPresenter
      include SqlApiHelper
      include MapsApiHelper

      def initialize(user, api_key)
        @user = user
        @api_key = api_key
      end

      def to_hash
        return unless @user

        base_rails_url = CartoDB.base_url(@user.username)

        {
          username: @user.username,
          organization: RestrictedOrganizationPresenter.new(@user.organization, @api_key).to_hash,
          api_endpoints: {
            sql: sql_api_url(@user.username),
            maps: maps_api_url(@user.username),
            import: base_rails_url,
            auth: base_rails_url
          }
        }
      end
    end
  end
end
