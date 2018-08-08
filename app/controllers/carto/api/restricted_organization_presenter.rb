module Carto
  module Api
    class RestrictedOrganizationPresenter
      def initialize(organization, api_key)
        @organization = organization
        @api_key = api_key
      end

      def to_hash
        return unless @organization

        {
          name: @organization.name
        }
      end
    end
  end
end
