# encoding: UTF-8

module OrganizationUsersHelper
  def load_organization
    @organization = current_viewer.organization
    render_jsonp('User has no organization', 404) if @organization.nil?
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
