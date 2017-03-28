require 'values'

module CartoGearsApi
  module Organizations
    # Organization information.
    #
    # @attr_reader [String] name Organization name.
    class Organization < Value.new(:name)

      # @api private
      def self.from_model(organization)
        CartoGearsApi::Organizations::Organization.with(
          name: organization.name
        )
      end
    end
  end
end
