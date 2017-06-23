# encoding: UTF-8
require_dependency 'carto/uuidhelper'

module OrganizationUsersHelper
  include Carto::UUIDHelper

  def load_organization
    id_or_name = params[:id_or_name]

    @organization = ::Organization.where(is_uuid?(id_or_name) ? { id: id_or_name } : { name: id_or_name }).first

    unless @organization
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

  def admins_only
    unless @organization.admin?(current_viewer)
      render_jsonp({}, 401)
      false
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

    hardened_params.keep_if { |k, _v| permitted.flatten.include?(k.to_sym) }

    hardened_params.symbolize_keys
  end

  # This is not run at model validation flow because we might want to override this rules.
  # owner parameter allows validation before actual value setting
  def soft_limits_validation(user, params_to_update, owner = user.organization.owner)
    errors = user.errors

    soft_geocoding_limit = soft_param_to_boolean(params_to_update[:soft_geocoding_limit])
    if user.soft_geocoding_limit != soft_geocoding_limit && soft_geocoding_limit && !owner.soft_geocoding_limit
      errors.add(:soft_geocoding_limit, "Organization owner hasn't this soft limit")
    end
    soft_here_isolines_limit = soft_param_to_boolean(params_to_update[:soft_here_isolines_limit])
    if user.soft_here_isolines_limit != soft_here_isolines_limit && soft_here_isolines_limit && !owner.soft_here_isolines_limit
      errors.add(:soft_here_isolines_limit, "Organization owner hasn't this soft limit")
    end
    soft_obs_snapshot_limit = soft_param_to_boolean(params_to_update[:soft_obs_snapshot_limit])
    if user.soft_obs_snapshot_limit != soft_obs_snapshot_limit && soft_obs_snapshot_limit && !owner.soft_obs_snapshot_limit
      errors.add(:soft_obs_snapshot_limit, "Organization owner hasn't this soft limit")
    end
    soft_obs_general_limit = soft_param_to_boolean(params_to_update[:soft_obs_general_limit])
    if user.soft_obs_general_limit != soft_obs_general_limit && soft_obs_general_limit && !owner.soft_obs_general_limit
      errors.add(:soft_obs_general_limit, "Organization owner hasn't this soft limit")
    end
    soft_twitter_datasource_limit = soft_param_to_boolean(params_to_update[:soft_twitter_datasource_limit])
    if user.soft_twitter_datasource_limit != soft_twitter_datasource_limit && soft_twitter_datasource_limit && !owner.soft_twitter_datasource_limit
      errors.add(:soft_twitter_datasource_limit, "Organization owner hasn't this soft limit")
    end
    soft_mapzen_routing_limit = soft_param_to_boolean(params_to_update[:soft_mapzen_routing_limit])
    if user.soft_mapzen_routing_limit != soft_mapzen_routing_limit && soft_mapzen_routing_limit && !owner.soft_mapzen_routing_limit
      errors.add(:soft_mapzen_routing_limit, "Organization owner hasn't this soft limit")
    end

    errors.empty?
  end

  def soft_param_to_boolean(value)
    value == 'true' || value == '1' || value == true
  end
end
