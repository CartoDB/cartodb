require_relative '../../services/dataservices-metrics/lib/geocoder_usage_metrics'
require_relative '../../services/dataservices-metrics/lib/isolines_usage_metrics'
require_relative '../../services/dataservices-metrics/lib/routing_usage_metrics'

module DataServicesMetricsHelper
  def get_user_geocoding_data(user, from, to, orgwise = true)
    get_geocoding_data(user, from, to, orgwise)
  end

  def get_organization_geocoding_data(organization, from, to)
    organization.require_organization_owner_presence!
    get_geocoding_data(organization.owner, from, to)
  end

  def get_user_here_isolines_data(user, from, to, orgwise = true)
    get_isolines_data(user, from, to, orgwise)
  end

  def get_organization_here_isolines_data(organization, from, to)
    organization.require_organization_owner_presence!
    get_isolines_data(organization.owner, from, to)
  end

  def get_user_mapzen_routing_data(user, from, to, orgwise = true)
    get_routing_data(user, from, to, orgwise)
  end

  def get_organization_mapzen_routing_data(organization, from, to)
    organization.require_organization_owner_presence!
    get_routing_data(organization.owner, from, to)
  end

  private

  def get_geocoding_data(user, from, to, orgwise = true)
    org = user.organization if orgwise
    geocoder_provider = org.try(:geocoder_provider) || user.geocoder_provider
    orgname = org.try(:name)
    usage_metrics = CartoDB::GeocoderUsageMetrics.new(user.username, orgname)
    # FIXME removed once we have fixed to charge google geocoder users for overquota
    return 0 if user.google_maps_geocoder_enabled?
    geocoder_key = CartoDB::GeocoderUsageMetrics::GEOCODER_KEYS.fetch(geocoder_provider, :geocoder_mapbox)
    cache_hits = 0
    success = usage_metrics.get_sum_by_date_range(geocoder_key, :success_responses, from, to)
    empty = usage_metrics.get_sum_by_date_range(geocoder_key, :empty_responses, from, to)
    hit = usage_metrics.get_sum_by_date_range(:geocoder_cache, :success_responses, from, to)
    success + empty + hit
  end

  def get_isolines_data(user, from, to, orgwise = true)
    org = user.organization if orgwise
    isolines_provider = org.try(:isolines_provider) || user.isolines_provider
    orgname = org.try(:name)
    usage_metrics = CartoDB::IsolinesUsageMetrics.new(user.username, orgname)
    isolines_key = CartoDB::IsolinesUsageMetrics::ISOLINES_KEYS.fetch(isolines_provider, :tomtom_isolines)
    success = usage_metrics.get_sum_by_date_range(isolines_key, :isolines_generated, from, to)
    empty = usage_metrics.get_sum_by_date_range(isolines_key, :empty_responses, from, to)
    success + empty
  end

  def get_routing_data(user, from, to, orgwise = true)
    org = user.organization if orgwise
    routing_provider = org.try(:routing_provider) || user.routing_provider
    orgname = org.try(:name)
    usage_metrics = CartoDB::RoutingUsageMetrics.new(user.username, orgname)
    routing_key = CartoDB::RoutingUsageMetrics::ROUTING_KEYS.fetch(routing_provider, :routing_tomtom)
    success = usage_metrics.get_sum_by_date_range(routing_key, :success_responses, from, to)
    empty = usage_metrics.get_sum_by_date_range(routing_key, :empty_responses, from, to)
    success + empty
  end
end
