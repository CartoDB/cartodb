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
        @presenter_cache = Carto::Api::PresenterCache.new
      end

      def with_presenter_cache(presenter_cache)
        @presenter_cache = presenter_cache
        self
      end

      def to_poro
        return to_public_poro unless @visualization.is_viewable_by_user?(@current_viewer)
        show_stats = @options.fetch(:show_stats, true)

        permission = @visualization.permission.nil? ? nil : Carto::Api::PermissionPresenter.new(@visualization.permission,
                                                                                                current_viewer: @current_viewer)
                                                                                           .with_presenter_cache(@presenter_cache)
                                                                                           .to_poro

        user_table_presentation = Carto::Api::UserTablePresenter.new(@visualization.user_table, @current_viewer)
                                                                .with_presenter_cache(@presenter_cache).to_poro

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
          permission: permission,
          locked: @visualization.locked,
          source: @visualization.source,
          title: @visualization.title,
          license: @visualization.license,
          attributions: @visualization.attributions,
          kind: @visualization.kind,
          likes: @visualization.likes_count,
          table: user_table_presentation,
          external_source: Carto::Api::ExternalSourcePresenter.new(@visualization.external_source).to_poro,
          synchronization: Carto::Api::SynchronizationPresenter.new(@visualization.synchronization).to_poro,
          liked: @current_viewer ? @visualization.is_liked_by_user_id?(@current_viewer.id) : false,
          url: url,
          uses_builder_features: @visualization.uses_builder_features?,
          auth_tokens: auth_tokens,
          version: @visualization.version || 2,
          # TODO: The following are Odyssey fields and could be removed
          # They are kept here for now for compatibility with the old presenter and JS code
          # `children` is hardcoded to avoid a performance impact (an extra query)
          prev_id: @visualization.prev_id,
          next_id: @visualization.next_id,
          parent_id: @visualization.parent_id,
          transition_options: @visualization.transition_options,
          active_child: nil,
          children: []
        }
        poro[:related_tables] = related_tables if @options.fetch(:related, true)
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

      # Ideally this should go at a lower level, as relates to url generation, but at least centralize logic here
      # INFO: For now, no support for non-org users, as intended use is for sharing urls
      def privacy_aware_map_url(additional_params = {}, action = 'public_visualizations_show_map')
        organization = @visualization.user.organization

        return unless organization

        # When a visualization is private, checks of permissions need not only the Id but also the vis owner database schema
        # Logic on public_map route will handle permissions so here we only "namespace the id" when proceeds
        if @visualization.is_privacy_private?
          # Final url will be like ORG.carto.com/u/VIEWER/viz/OWNER_SCHEMA.VIS_ID/public_map
          base_url_username = @current_viewer.username
          vis_id_schema = @visualization.user.sql_safe_database_schema
        else
          # Final url will be like ORG.carto.com/u/VIEWER/viz/VIS_ID/public_map
          base_url_username = @visualization.user.username
          vis_id_schema = nil
        end
        # this builds only the fragment /viz/xxxxx/public_map
        path = CartoDB.path(@context, action, additional_params.merge(id: qualified_visualization_id(vis_id_schema)))
        "#{CartoDB.base_url(organization.name, base_url_username)}#{path}"
      end

      def qualified_visualization_id(schema = nil)
        schema.nil? ? @visualization.id : "#{schema}.#{@visualization.id}"
      end

      private

      def auth_tokens
        if @visualization.password_protected? && @visualization.user.id == @current_viewer.id
          @visualization.get_auth_tokens
        elsif @visualization.is_privacy_private?
          @current_viewer.get_auth_tokens
        else
          []
        end
      end

      def related_tables
        related = if @visualization.user_table
                    @visualization.related_tables.select { |table| table.id != @visualization.user_table.id }
                  else
                    @visualization.related_tables
                  end

        related.map do |table|
          Carto::Api::UserTablePresenter.new(table, @current_viewer).to_poro
        end
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
          CartoDB.url(@context, 'public_tables_show_bis', { id: @visualization.qualified_name(@current_viewer) },
                      @current_viewer)
        else
          CartoDB.url(@context, 'public_visualizations_show_map', { id: @visualization.id }, @current_viewer)
        end
      end

    end
  end
end
