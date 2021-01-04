require './lib/carto/subscribers/base'

module Carto
  module Subscribers
    class CentralOrganizationCommands < ::Carto::Subscribers::Base

      attr_accessor :organization

      def update_organization(params = {})
        params = params.with_indifferent_access
        log_command_start(__method__, params)

        organization = Carto::Organization.find(params[:id])
        organization.set_fields_from_central(params[:organization], :update)
        organization.save!
      rescue StandardError => e
        log_error(message: 'Error updating organization', exception: e, organization: organization&.name)
      ensure
        log_command_end(__method__, organization: organization.name)
      end

      def create_organization(params = {})
        params = params.with_indifferent_access
        log_command_start(__method__, params)

        organization = Carto::Organization.new
        organization.set_fields_from_central(params[:organization], :create)
        organization.save!

        if params[:organization][:owner_id].present? && organization.owner.nil?
          CartoDB::UserOrganization.new(organization.id, params[:organization][:owner_id])
                                   .promote_user_to_admin
        end

        notifications_topic.publish(:organization_created, organization.attributes.slice('id', 'name'))
      rescue StandardError => e
        log_error(
          message: 'Error creating organization',
          exception: e,
          error_detail: organization&.errors&.full_messages&.inspect
        )
      ensure
        log_command_end(__method__, organization: organization.name)
      end

      def delete_organization(params = {})
        params = params.with_indifferent_access
        log_command_start(__method__, params)

        organization = Carto::Organization.find_by(id: params[:id])

        # Make the process resilient by handling both scenarios
        if organization
          organization.destroy_cascade(delete_in_central: false)
        else
          log_info(message: 'Organization does not exist', organization_id: params[:id])
        end

        # Notify even if the organization didn't exist, so it is deleted in Central.
        notifications_topic.publish(:organization_deleted, id: params[:id])
      rescue StandardError => e
        log_error(message: 'Error deleting organization', exception: e, organization: organization)
      ensure
        log_command_end(__method__, organization_id: params[:id])
      end

    end
  end
end
