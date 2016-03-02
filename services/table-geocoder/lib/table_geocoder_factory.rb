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
      user.db_service.reset_pooled_connections
      log = params.fetch(:log)
      log.append 'TableGeocoderFactory.get()'
      log.append "params: #{params.select{|k| k != :log}.to_s}"

      if user == table_service.owner
        user_connection = user.in_database
      else
        if !table_service.table_visualization.has_permission?(user, CartoDB::Visualization::Member::PERMISSION_READWRITE)
          raise 'Insufficient permissions on table'
        end
        user_connection = table_service.owner.in_database
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

      instance_config[:usage_metrics] = get_geocoder_metrics_instance(user)
      instance_config[:log] = log

      log.append "geocoder_class = #{geocoder_class.to_s}"
      instance = geocoder_class.new(instance_config)
      log.append "geocoder_type = #{instance.name}"
      instance
    end

    def self.get_geocoder_metrics_instance(user)
      orgname = user.organization.nil? ? nil : user.organization.name
      CartoDB::GeocoderUsageMetrics.new(user.username, orgname)
    end
  end
end
