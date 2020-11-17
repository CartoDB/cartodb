module Carto
  module Subscribers
    class CentralOrganizationCommands < ::Carto::Subscribers::Base

      attr_accessor :organization

      def update_organization(params = {})
        log_command_start(__method__)
        load_organization(params)

        organization.set_fields_from_central(params[:organization], :update)
        organization.save
      ensure
        log_command_end(__method__, organization: organization.name)
      end

      def create_organization(params = {})
        log_command_start(__method__)

        organization = Carto::Organization.new
        organization.set_fields_from_central(params[:organization], :create)

        if organization.save && params[:organization][:owner_id].present? && organization.owner.nil?
          CartoDB::UserOrganization.new(organization.id, params[:organization][:owner_id])
                                   .promote_user_to_admin
        end
      ensure
        log_command_end(__method__, organization: organization.name)
      end

      def delete_organization(params = {})
        log_command_start(__method__)
        load_organization(params)

        organization.destroy_cascade(delete_in_central: false)
      ensure
        log_command_end(__method__, organization: organization.name)
      end

      private

      def load_organization(params)
        self.organization = Carto::Organization.find_by(id: params[:id])
      end

    end
  end
end
