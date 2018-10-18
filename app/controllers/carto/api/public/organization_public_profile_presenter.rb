module Carto
  module Api
    module Public
      class OrganizationPublicProfilePresenter
        def initialize(organization)
          @organization = organization
        end

        def to_hash
          {
            owner: {
              username: @organization.owner.username
            }
          }
        end
      end
    end
  end
end
