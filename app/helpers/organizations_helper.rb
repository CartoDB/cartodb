# encoding: UTF-8

module OrganizationsHelper

  def load_organization
    @organization = Carto::Organization.where(id: params[:id]).first
    render_jsonp({}, 401) and return if @organization.nil?
  end

  def load_group
    if params[:group_id]
      @group = @organization.groups.find(params[:group_id])
      render_jsonp({ errors: "No #{params[:group_id]} at #{@organization.id}" }, 404) and return unless @group
    end
  end

  # To help with strong params until Rails 4+
  def permit(*permitted)
    params.keep_if { |k, _v| permitted.include?(k.to_sym) }

    params
  end
end
