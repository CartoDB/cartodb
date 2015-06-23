# encoding: utf-8

require_relative 'table_geocoder'
require_relative 'internal_geocoder'
require_relative 'gme/table_geocoder'
require_relative 'exceptions'

module Carto
  class TableGeocoderFactory

    def self.get(user, cartodb_geocoder_config, table_service, params = {})
      # Reset old connections to make sure changes apply.
      # NOTE: This assumes it's being called from a Resque job
      if user.present?
        user.reset_pooled_connections
        user_connection = user.in_database
      else
        user_connection = nil
      end

      instance_config = cartodb_geocoder_config
        .deep_symbolize_keys
        .merge(
               table_schema:  table_service.try(:database_schema),
               table_name:    table_service.try(:name),
               qualified_table_name: table_service.try(:qualified_table_name),
               sequel_qualified_table_name: table_service.try(:sequel_qualified_table_name),
               connection:    user_connection
               )
        .merge(params)

      kind = instance_config.fetch(:kind)

      if kind == 'high-resolution'
        if user.has_feature_flag?('google_maps')
          if user.google_maps_geocoder_enabled?
            geocoder_class = Carto::Gme::TableGeocoder
            instance_config.merge!(client_id: user.google_maps_client_id, private_key: user.google_maps_private_key)
          else
            raise GeocoderErrors::MisconfiguredGmeGeocoderError.new
          end
        else
          geocoder_class = CartoDB::TableGeocoder
        end
      else
        geocoder_class = CartoDB::InternalGeocoder::Geocoder
      end

      return geocoder_class.new(instance_config)
    end

  end
end
