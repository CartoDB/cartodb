module OrganizationCommands
  class Delete < ::CartoCommand

    private

    def run_command
      organization = Carto::Organization.find_by(id: params[:id])

      # Make the process resilient by handling both scenarios
      if organization
        organization.destroy_cascade(delete_in_central: false)
      else
        logger.info(message: 'Organization does not exist', organization_id: params[:id])
      end

      # Notify even if the organization didn't exist, so it is deleted in Central.
      notifications_topic.publish(:organization_deleted, id: params[:id])
    end

    def log_context
      super.merge(organization_id: params[:id])
    end

  end
end
