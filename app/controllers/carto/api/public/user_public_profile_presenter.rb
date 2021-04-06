module Carto
  module Api
    module Public
      class UserPublicProfilePresenter < UserPublicPresenter

        def initialize(user)
          @user = user
        end

        def to_hash
          org_hash = OrganizationPublicProfilePresenter.new(@user.organization).to_hash if @user.has_organization?

          super.deep_merge(
            region: Cartodb.get_config(:bigquery_region),
            organization: org_hash,
            groups: @user.groups.map { |g| { name: g.name, display_name: g.display_name } },
            avatar_url: @user.avatar_url,
            first_name: @user.name,
            last_name: @user.last_name,
            api_endpoints: {
              maps_api_v2_template: maps_api_v2_template
            }
          )
        end

      end
    end
  end
end
