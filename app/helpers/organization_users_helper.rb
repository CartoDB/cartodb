# encoding: UTF-8

module OrganizationUsersHelper
  def load_organization
    @organization = Organization.where(name: params[:name]).first
    if @organization.nil?
      render_jsonp({}, 401) # Not giving clues to guessers via 404
      return
    end
  end

  def owners_only
    unless current_viewer_is_owner?
      render_jsonp({}, 401)
      return
    end
  end

  def load_user
    @user = ::User.where(username: params[:u_username], organization: @organization).first

    if @user.nil?
      render_jsonp("No user with username '#{params[:u_username]}' in '#{@organization.name}'", 404)
      return
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
