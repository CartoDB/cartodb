module Carto
  module Api
    class OrganizationPublicPresenter
      def initialize(organization)
        @organization = organization
      end

      def to_hash
        {
          name: @organization.name
        }
      end
    end
  end
end
