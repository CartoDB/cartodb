# encoding: utf-8
require_relative './stats'
require_relative '../overlay/collection'

module CartoDB
  module Visualization
    class Relator
      LAYER_SCOPES  = {
                        base:             :user_layers,
                        cartodb:          :data_layers,
                        carto_and_torque: :carto_and_torque_layers,
                        others:           :other_layers
                      }

      INTERFACE     = %w{ overlays map user table related_tables layers stats
                      single_data_layer? synchronization }

      def initialize(attributes={})
        @id     = attributes.fetch(:id)
        @map_id = attributes.fetch(:map_id)
      end #initialize

      def overlays
        @overlays ||= Overlay::Collection.new(visualization_id: id).fetch
      end #overlays

      def map
        @map ||= ::Map.where(id: map_id).first
      end #map

      def user
        @user ||= map.user if map
      end #user

      def table
        return nil unless defined?(::Table)
        @table ||= ::Table.where(map_id: map_id).first 
      end #table

      def related_tables
        @related_tables ||= layers(:carto_and_torque)
          .flat_map(&:affected_tables).uniq
      end #related_tables

      def layers(kind)
        return [] unless map
        map.send(LAYER_SCOPES.fetch(kind))
      end #layers

      def synchronization
        return {} unless table
        table.synchronization
      end

      def stats(user=nil)
        @stats ||= Visualization::Stats.new(self, user).to_poro
      end #stats

      def single_data_layer?
        layers(:cartodb).to_a.length == 1 || related_tables.length == 1
      end #single_data_layer?

      attr_reader :id, :map_id
    end # Relator
  end # Visualization
end # CartoDB

