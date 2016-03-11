# encoding: UTF-8

module OrganizationUsersHelper
  def load_organization
    @organization = Organization.where(name: params[:name]).first
    if @organization.nil?
      render_jsonp({}, 401) # Not giving clues to guessers via 404
      return false
    end
  end

  def owners_only
    unless current_viewer_is_owner?
      render_jsonp({}, 401)
      return false
    end
  end

  def load_user
    @user = ::User.where(username: params[:u_username], organization: @organization).first

    if @user.nil?
      render_jsonp("No user with username '#{params[:u_username]}' in '#{@organization.name}'", 404)
      return false
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

  # This is not run at model validation flow because we might want to override this rules.
  def soft_limits_validation(user, params_to_update)
    errors = user.errors
    owner = user.organization.owner
    soft_geocoding_limit = !!params_to_update[:soft_geocoding_limit]
    if user.soft_geocoding_limit != soft_geocoding_limit && soft_geocoding_limit && !owner.soft_geocoding_limit
      errors.add(:soft_geocoding_limit, "Organization owner hasn't this soft limit")
    end
    soft_here_isolines_limit = !!params_to_update[:soft_here_isolines_limit]
    if user.soft_here_isolines_limit != soft_here_isolines_limit && soft_here_isolines_limit && !owner.soft_here_isolines_limit
      errors.add(:soft_here_isolines_limit, "Organization owner hasn't this soft limit")
    end
    soft_twitter_datasource_limit = !!params_to_update[:soft_twitter_datasource_limit]
    if user.soft_twitter_datasource_limit != soft_twitter_datasource_limit && soft_twitter_datasource_limit && !owner.soft_twitter_datasource_limit
      errors.add(:soft_twitter_datasource_limit, "Organization owner hasn't this soft limit")
    end

    errors.empty?
  end
end
