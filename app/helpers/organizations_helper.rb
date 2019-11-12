module OrganizationsHelper
  def load_organization
    @organization = Carto::Organization.where(id: params[:id]).first
    render_jsonp({}, 401) if @organization.nil?
  end

  def load_group
    if params[:group_id]
      @group = @organization.groups.find(params[:group_id])
      render_jsonp({ errors: "No #{params[:group_id]} at #{@organization.id}" }, 404) && return unless @group
    end
  end

  def current_viewer_is_owner?
    current_viewer.id == @organization.owner.id
  end

  # To help with strong params until Rails 4+
  def permit(*permitted)
    hardened_params = params.dup

    hardened_params.keep_if { |k, _v| permitted.include?(k.to_sym) }

    hardened_params.symbolize_keys
  end
end
