module Carto
  module Api
    module Public
      class UserPublicProfilePresenter < UserPublicPresenter
        def initialize(user)
          @user = user
        end

        def to_hash
          org_hash = OrganizationPublicProfilePresenter.new(@user.organization).to_hash if @user.has_organization?

          super.deep_merge!(
            organization: org_hash,
            avatar_url: @user.avatar_url,
            name: @user.name,
            last_name: @user.last_name
          )
        end
      end
    end
  end
end
