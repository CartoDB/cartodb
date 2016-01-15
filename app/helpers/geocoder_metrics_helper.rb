# encoding: utf-8

require_relative '../../services/table-geocoder/lib/table_geocoder_factory'

module GeocoderMetricsHelper
  def get_user_geocoding_data(user, from, to)
    get_geocoding_data(user, from, to)
  end

  def get_organization_geocoding_data(organization, from, to)
    return if organization.owner.nil?
    get_geocoding_data(organization.owner, from, to)
  end

  private

  def get_geocoding_data(user, from, to)
    usage_metrics = Carto::TableGeocoderFactory.get_geocoder_metrics_instance(user)
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
end
