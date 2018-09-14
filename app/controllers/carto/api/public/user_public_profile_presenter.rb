module Carto
  module Api
    module Public
      class UserPublicProfilePresenter
        def initialize(user)
          @user = user
        end

        def to_hash
          {
            organization: @user.has_organization? ? OrganizationPublicProfilePresenter.new(@user.organization).to_hash : nil,
            avatar_url: @user.avatar_url,
            name: @user.name,
            last_name: @user.last_name
          }
        end
      end
    end
  end
end
