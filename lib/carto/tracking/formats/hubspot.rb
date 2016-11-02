# encoding utf-8

module Carto
  module Tracking
    module Formats
      class Hubspot
        def initialize(user: nil, visualization: nil, hash: {})
          @user = user
          @visualization = visualization
          @hash = hash
        end

        def to_hash
          properties_hash = @hash

          properties_hash.merge(user_properties)
          properties_hash.merge(visualization_properities)

          properties_hash
        end

        private

        def user_properties
          return {} unless @user

          user_organization = @user.organization ? @user.organization.name : ''

          {
            user_username: @user.username,
            user_email: @user.email,
            user_organization: user_organization,
            user_account_type: @user.account_type
          }
        end

        def visualization_properties
          return {} unless @visualization

          {
            visualization_id: @visualization.id,
            visualization_created_at: @visualization.created_at
          }
        end
      end
    end
  end
end
