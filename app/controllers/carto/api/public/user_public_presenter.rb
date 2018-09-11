module Carto
  module Api
    module Public
      class UserPublicPresenter
        include SqlApiHelper
        include MapsApiHelper

        def initialize(user)
          @user = user
        end

        def to_hash
          base_rails_url = CartoDB.base_url(@user.username)

          {
            username: @user.username,
            organization: @user.has_organization? ? OrganizationPublicPresenter.new(@user.organization).to_hash : nil,
            org_admin: @user.organization_admin?,
            avatar_url: @user.avatar_url,
            name: @user.name,
            last_name: @user.last_name,
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
end
