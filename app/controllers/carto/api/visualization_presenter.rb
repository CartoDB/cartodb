require_relative 'external_source_presenter'
require_relative 'permission_presenter'
require_relative 'user_table_presenter'

module Carto
  module Api
    class VisualizationPresenter

      # options
      # - related: load related tables. Default: true.
      # - show_stats: load stats (daily mapview counts). Default: true.
      def initialize(visualization, current_viewer, context, options = {})
        @visualization = visualization
        @current_viewer = current_viewer
        @context = context
        @options = options
      end

      def to_poro
        show_stats = @options.fetch(:show_stats, true)

        poro = {
          id: @visualization.id,
          name: @visualization.name,
          display_name: @visualization.display_name,
          map_id: @visualization.map_id,
          active_layer_id: @visualization.active_layer_id,
          type: @visualization.type,
          tags: @visualization.tags,
          description: @visualization.description,
          privacy: @visualization.privacy.upcase,
          stats: show_stats ? @visualization.stats : {},
          created_at: @visualization.created_at,
          updated_at: @visualization.updated_at,
          permission: @visualization.permission.nil? ? nil : Carto::Api::PermissionPresenter.new(@visualization.permission).to_poro,
          locked: @visualization.locked,
          source: @visualization.source,
          title: @visualization.title,
          parent_id: @visualization.parent_id,
          license: @visualization.license,
          attributions: @visualization.attributions,
          kind: @visualization.kind,
          likes: @visualization.likes.count,
          prev_id: @visualization.prev_id,
          next_id: @visualization.next_id,
          transition_options: @visualization.transition_options,
          active_child: @visualization.active_child,
          table: Carto::Api::UserTablePresenter.new(@visualization.table, @visualization.permission, @current_viewer).to_poro,
          external_source: Carto::Api::ExternalSourcePresenter.new(@visualization.external_source).to_poro,
          synchronization: Carto::Api::SynchronizationPresenter.new(@visualization.synchronization).to_poro,
          children: @visualization.children.map { |v| children_poro(v) },
          liked: @current_viewer ? @visualization.is_liked_by_user_id?(@current_viewer.id) : false,
          legend_style: @visualization.legend_style,
          url: url
        }
        poro.merge!( { related_tables: related_tables } ) if @options.fetch(:related, true)
        poro
      end

      def to_public_poro
        {
          id:               @visualization.id,
          name:             @visualization.name,
          type:             @visualization.type,
          tags:             @visualization.tags,
          description:      @visualization.description,
          updated_at:       @visualization.updated_at,
          title:            @visualization.title,
          kind:             @visualization.kind,
          privacy:          @visualization.privacy.upcase,
          likes:            @visualization.likes_count
        }
      end


      private

      def related_tables
        related = @visualization.table ?
          @visualization.related_tables.select { |table| table.id != @visualization.table.id } :
          @visualization.related_tables

        related.map { |table| Carto::Api::UserTablePresenter.new(table, @visualization.permission, @current_viewer).to_poro }
      end

      def children_poro(visualization)
        {
          id: visualization.id,
          prev_id: visualization.prev_id,
          type: visualization.type,
          next_id: visualization.next_id,
          transition_options: visualization.transition_options,
          map_id: visualization.map_id
        }
      end

      def url
        if @visualization.canonical?
          CartoDB.url(@context, 'public_tables_show_bis', { id: @visualization.qualified_name(@current_viewer) }, @current_viewer)
        else
          CartoDB.url(@context, 'public_visualizations_show_map', { id: @visualization.id }, @current_viewer)
        end
      end

    end
  end
end
