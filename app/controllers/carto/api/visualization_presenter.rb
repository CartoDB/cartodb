require_relative 'external_source_presenter'
require_relative 'permission_presenter'
require_relative 'user_table_presenter'

module Carto
  module Api
    class VisualizationPresenter

      def initialize(visualization, current_viewer, context,
                     related: true, related_canonical_visualizations: false, show_user: false,
                     show_stats: true, show_likes: true, show_liked: true, show_table: true,
                     show_permission: true, show_synchronization: true, show_uses_builder_features: true,
                     show_table_size_and_row_count: true, show_auth_tokens: true, show_user_basemaps: false,
                     password: nil)
        @visualization = visualization
        @current_viewer = current_viewer
        @context = context

        @related = related
        @load_related_canonical_visualizations = related_canonical_visualizations
        @show_user = show_user
        @show_stats = show_stats
        @show_likes = show_likes
        @show_liked = show_liked
        @show_table = show_table
        @show_permission = show_permission
        @show_synchronization = show_synchronization
        @show_uses_builder_features = show_uses_builder_features
        @show_table_size_and_row_count = show_table_size_and_row_count
        @show_auth_tokens = show_auth_tokens
        @show_user_basemaps = show_user_basemaps
        @password = password

        @presenter_cache = Carto::Api::PresenterCache.new
      end

      def with_presenter_cache(presenter_cache)
        @presenter_cache = presenter_cache
        self
      end

      def to_poro
        return_private_poro = @visualization.can_view_private_info?(@current_viewer)

        poro = return_private_poro ? to_private_poro : to_public_poro

        poro[:user] = user if show_user

        if load_related_canonical_visualizations
          poro[:related_canonical_visualizations] = related_canonicals
          # The count doesn't take into account privacy concerns
          poro[:related_canonical_visualizations_count] = @visualization.related_canonical_visualizations.count
        end

        poro[:liked] = @current_viewer ? @visualization.liked_by?(@current_viewer.id) : false if show_liked
        poro[:permission] = permission if show_permission
        poro[:stats] = show_stats ? @visualization.stats : {}

        if show_auth_tokens
          poro[:auth_tokens] = auth_tokens
        elsif return_private_poro || @visualization.is_accessible_with_password?(@current_viewer, @password)
          poro[:auth_tokens] = auth_tokens
        end

        poro[:table] = user_table_presentation if show_table

        poro
      end

      def to_private_poro
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
          created_at: @visualization.created_at,
          updated_at: @visualization.updated_at,
          locked: @visualization.locked,
          source: @visualization.source,
          title: @visualization.title,
          license: @visualization.license,
          attributions: @visualization.attributions,
          kind: @visualization.kind,
          external_source: Carto::Api::ExternalSourcePresenter.new(@visualization.external_source).to_poro,
          url: url,
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

        poro[:related_tables] = related_tables if related
        poro[:likes] = @visualization.likes_count if show_likes
        poro[:synchronization] = synchronization if show_synchronization
        poro[:uses_builder_features] = @visualization.uses_builder_features? if show_uses_builder_features

        poro
      end

      def to_public_poro
        {
          id:               @visualization.id,
          name:             @visualization.name,
          display_name:     @visualization.display_name,
          attributions:     @visualization.attributions,
          source:           @visualization.source,
          license:          @visualization.license,
          type:             @visualization.type,
          tags:             @visualization.tags,
          description:      @visualization.description,
          created_at:       @visualization.created_at,
          updated_at:       @visualization.updated_at,
          title:            @visualization.title,
          kind:             @visualization.kind,
          privacy:          @visualization.privacy.upcase,
          likes:            @visualization.likes_count
        }
      end

      # For dependent visualizations
      def to_summarized_poro
        {
          id:          @visualization.id,
          name:        @visualization.name,
          updated_at:  @visualization.updated_at,
          permission:  permission.slice(:id, :owner),
          auth_tokens: auth_tokens
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

      attr_reader :related, :load_related_canonical_visualizations, :show_user,
                  :show_stats, :show_likes, :show_liked, :show_table,
                  :show_permission, :show_synchronization, :show_uses_builder_features,
                  :show_table_size_and_row_count, :show_auth_tokens,
                  :show_user_basemaps

      def user_table_presentation
        Carto::Api::UserTablePresenter.new(@visualization.user_table, @current_viewer,
                                           show_size_and_row_count: show_table_size_and_row_count)
                                      .with_presenter_cache(@presenter_cache).to_poro
      end

      def synchronization
        Carto::Api::SynchronizationPresenter.new(@visualization.synchronization).to_poro
      end

      def permission
        unless @visualization.permission.nil?
          Carto::Api::PermissionPresenter.new(@visualization.permission, current_viewer: @current_viewer)
                                         .with_presenter_cache(@presenter_cache).to_poro
        end
      end

      def auth_tokens
        if @visualization.password_protected? && (@visualization.user.id == @current_viewer.try(:id) || @visualization.password_valid?(@password))
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

      def related_canonicals
        @visualization
          .related_canonical_visualizations
          .select { |v| v.is_viewable_by_user?(@current_viewer) }
          .map { |v| self.class.new(v, @current_viewer, @context).to_poro }
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

      def user
        Carto::Api::UserPresenter.new(@visualization.user,
                                      current_viewer: @current_viewer,
                                      fetch_db_size: false,
                                      fetch_basemaps: show_user_basemaps,
                                      fetch_profile: false).to_poro
      end
    end
  end
end
