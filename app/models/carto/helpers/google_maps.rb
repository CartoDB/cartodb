module Carto::GoogleMaps
  def google_maps_api_key
    organization&.google_maps_key.presence || google_maps_key
  end

  alias_method :google_maps_query_string, :google_maps_api_key

  def google_maps_geocoder_enabled?
    google_maps_private_key.present? && google_maps_client_id.present?
  end

  def google_maps_client_id
    Rack::Utils.parse_nested_query(google_maps_query_string)['client'] if google_maps_query_string
  end

  def basemaps
    (Cartodb.config[:basemaps] || []).select { |group| group != 'GMaps' || google_maps_enabled? }
  end

  def google_maps_enabled?
    google_maps_query_string.present?
  end
end
