module OrganizationCommands
  class Create < ::BaseCommand

    private

    def run_command
      organization = Carto::Organization.new
      organization.set_fields_from_central(params[:organization], :create)
      organization.save!

      if params[:organization][:owner_id].present? && organization.owner.nil?
        CartoDB::UserOrganization.new(organization.id, params[:organization][:owner_id])
                                 .promote_user_to_admin
      end

      notifications_topic.publish(:organization_created, organization.attributes.slice('id', 'name'))
    end

    def loggable_params
      { organization_name: params[:organization][:name] }
    end

  end
end
