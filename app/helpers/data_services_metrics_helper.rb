# encoding: utf-8

require_relative '../../services/dataservices-metrics/lib/geocoder_usage_metrics'
require_relative '../../services/dataservices-metrics/lib/here_isolines_usage_metrics'
require_relative '../../services/dataservices-metrics/lib/observatory_snapshot_usage_metrics'

module DataServicesMetricsHelper
  def get_user_geocoding_data(user, from, to)
    get_geocoding_data(user, from, to)
  end

  def get_organization_geocoding_data(organization, from, to)
    return if organization.owner.nil?
    get_geocoding_data(organization.owner, from, to)
  end

  def get_user_here_isolines_data(user, from, to)
    get_here_isolines_data(user, from, to)
  end

  def get_organization_here_isolines_data(organization, from, to)
    return if organization.owner.nil?
    get_here_isolines_data(organization.owner, from, to)
  end

  def get_user_obs_snapshot_data(user, from, to)
    get_obs_snapshot_data(user, from, to)
  end

  def get_organization_obs_snapshot_data(organization, from, to)
    return if organization.owner.nil?
    get_obs_snapshot_data(organization.owner, from, to)
  end

  private

  def get_geocoding_data(user, from, to)
    orgname = user.organization.nil? ? nil : user.organization.name
    usage_metrics = CartoDB::GeocoderUsageMetrics.new(user.username, orgname)
    # FIXME removed once we have fixed to charge google geocoder users for overquota
    return 0 if user.google_maps_geocoder_enabled?
    geocoder_key = user.google_maps_geocoder_enabled? ? :geocoder_google : :geocoder_here
    cache_hits = 0
    countable_requests = 0
    from.upto(to).each do |date|
      success = usage_metrics.get(geocoder_key, :success_responses, date)
      countable_requests += success unless success.nil?
      empty = usage_metrics.get(geocoder_key, :empty_responses, date)
      countable_requests += empty unless empty.nil?
      hit = usage_metrics.get(:geocoder_cache, :success_responses, date)
      cache_hits += hit unless hit.nil?
    end
    countable_requests + cache_hits
  end

  def get_here_isolines_data(user, from, to)
    orgname = user.organization.nil? ? nil : user.organization.name
    usage_metrics = CartoDB::HereIsolinesUsageMetrics.new(user.username, orgname)
    here_isolines_key = :here_isolines
    countable_requests = 0
    from.upto(to).each do |date|
      success = usage_metrics.get(here_isolines_key, :isolines_generated, date)
      countable_requests += success unless success.nil?
      empty = usage_metrics.get(here_isolines_key, :empty_responses, date)
      countable_requests += empty unless empty.nil?
    end
    countable_requests
  end

  def get_obs_snapshot_data(user, from, to)
    orgname = user.organization.nil? ? nil : user.organization.name
    usage_metrics = CartoDB::ObservatorySnapshotUsageMetrics.new(user.username, orgname)
    obs_snapshot_key = :obs_snapshot
    countable_requests = 0
    from.upto(to).each do |date|
      success = usage_metrics.get(obs_snapshot_key, :success_responses, date)
      countable_requests += success unless success.nil?
      empty = usage_metrics.get(obs_snapshot_key, :empty_responses, date)
      countable_requests += empty unless empty.nil?
    end
    countable_requests
  end

end
