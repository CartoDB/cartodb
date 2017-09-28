# encoding: utf-8
require_relative './stats'
require_relative '../visualization/collection'
require_relative './support_tables'
require_relative '../map'
require_relative '../layer'

module CartoDB
  module Visualization
    class Relator
      LAYER_SCOPES = {
        base:             :user_layers,
        cartodb:          :carto_layers,
        data:             :data_layers,
        others:           :other_layers,
        named_map:        :named_maps_layers
      }.freeze

      INTERFACE = %w{ overlays user table related_templates related_tables related_canonical_visualizations
                      layers stats mapviews total_mapviews data_layers synchronization synced? permission
                      parent children support_tables prev_list_item next_list_item likes likes_count reload_likes
                      estimated_row_count actual_row_count }.freeze

      def initialize(map, attributes = {})
        @id             = attributes.fetch(:id)
        @user_id        = attributes.fetch(:user_id)
        @permission_id  = attributes.fetch(:permission_id)
        @parent_id      = attributes.fetch(:parent_id)
        @kind           = attributes.fetch(:kind)
        @support_tables = nil
        @likes          = nil
        @prev_id        = attributes.fetch(:prev_id)
        @next_id        = attributes.fetch(:next_id)
        @map            = map
      end

      # @return []
      def children
        ordered = []
        children_vis = Visualization::Collection.new.fetch(parent_id: @id)
        if children_vis.count > 0
          ordered << children_vis.select { |vis| vis[:prev_id].nil? }.first
          while !ordered.last[:next_id].nil?
            target = ordered.last[:next_id]
            unless target.nil?
              ordered << children_vis.select { |vis| vis[:id] == target }.first
            end
          end
        end
        ordered
      end

      # @return CartoDB::Visualization::Member
      def parent
        @parent ||= Visualization::Member.new(id: @parent_id).fetch unless @parent_id.nil?
      end

      # @return CartoDB::Visualization::Member
      def prev_list_item
        @prev_vis ||= Visualization::Member.new(id: @prev_id).fetch unless @prev_id.nil?
      end

      # @return CartoDB::Visualization::Member
      def next_list_item
         @next_vis ||= Visualization::Member.new(id: @next_id).fetch unless @next_id.nil?
      end

      def support_tables
        @support_tables ||= Visualization::SupportTables.new(
          user.in_database, parent_id: @id, parent_kind: @kind, public_user_roles: user.db_service.public_user_roles)
      end

      def overlays
        @overlays ||= Carto::Overlay.where(visualization_id: id).all
      end

      def user
        @user ||= ::User[@user_id] unless @user_id.nil?
      end

      def table
        return nil if map.nil?
        @table ||= ::UserTable.from_map_id(map.id).try(:service)
      end

      def estimated_row_count
        table.nil? ? nil : table.estimated_row_count
      end

      def actual_row_count
        table.nil? ? nil : table.actual_row_count
      end

      def related_templates
        Carto::Template.where(source_visualization_id: @id).all
      end

      def related_tables
        @related_tables ||= layers(:data).flat_map { |layer| layer.user_tables.map(&:service) }.uniq(&:id)
      end

      def related_canonical_visualizations
        @related_canonical_visualizations ||= get_related_canonical_visualizations
      end

      def layers(kind)
        return [] unless map
        map.send(LAYER_SCOPES.fetch(kind))
      end

      def synchronization
        CartoDB::Synchronization::Member.new(visualization_id: @id).fetch_by_visualization_id
      rescue KeyError
        {}
      end

      def synced?
        !synchronization.is_a?(Hash)
      end

      def stats(user=nil)
        @stats ||= Visualization::Stats.new(self, user).to_poro
      end

      def mapviews(user=nil)
        @mapviews ||= stats(user).collect { |o| o[1] }.reduce(:+)
      end

      def total_mapviews(user=nil)
        @total_mapviews ||= Visualization::Stats.new(self, user).total_mapviews
      end

      def data_layers
        layers(:data)
      end

      def permission
        @permission ||= CartoDB::Permission.where(id: @permission_id).first unless @permission_id.nil?
      end

      def likes
        @likes ||= likes_search.all.to_a
      end

      def likes_count
        @likes_count ||= likes_search.count
      end

      def reload_likes
        @likes = nil
        likes
      end

      attr_reader :id, :map

      private

      def likes_search
        Like.where(subject: @id)
      end

      def get_related_canonical_visualizations
        get_related_visualizations_by_types([CartoDB::Visualization::Member::TYPE_CANONICAL])
      end

      def get_related_visualizations_by_types(types)
        related_map_ids = related_tables.map(&:map_id)
        CartoDB::Visualization::Collection.new.fetch(map_id: related_map_ids, type: types)
      end

    end
  end
end
