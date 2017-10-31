
module Carto
  module Api
    class UserTablePresenter
      # options:
      # - accessible_dependent_derived_maps

      PRIVACY_PRIVATE = 0
      PRIVACY_PUBLIC = 1
      PRIVACY_LINK = 2

      PRIVACY_VALUES_TO_TEXTS = {
          PRIVACY_PRIVATE => 'private',
          PRIVACY_PUBLIC => 'public',
          PRIVACY_LINK => 'link'
      }

      def initialize(user_table, current_viewer, show_size_and_row_count: true)
        @user_table = user_table
        @current_viewer = current_viewer
        @presenter_cache = Carto::Api::PresenterCache.new
        @show_size_and_row_count = show_size_and_row_count
      end

      def with_presenter_cache(presenter_cache)
        @presenter_cache = presenter_cache
        self
      end

      def to_poro(accessible_dependent_derived_maps: false, context: nil)
        return {} if @user_table.nil?
        permission = @user_table.permission
        permission_presentation = Carto::Api::PermissionPresenter.new(
          permission, current_viewer: @current_viewer
        ).with_presenter_cache(@presenter_cache).to_poro if permission

        poro = {
          id: @user_table.id,
          name: @user_table.name_for_user(@current_viewer),
          permission: permission_presentation,
          geometry_types: @user_table.geometry_types,
          privacy: privacy_text(@user_table.privacy).upcase,
          updated_at: @user_table.updated_at
        }

        if @user_table.is_owner?(@current_viewer)
          poro[:synchronization] = Carto::Api::SynchronizationPresenter.new(@user_table.synchronization).to_poro
        end

        if show_size_and_row_count
          row_count_and_size = @user_table.row_count_and_size
          poro[:size] = row_count_and_size[:size]
          poro[:row_count] = row_count_and_size[:row_count]
        end

        if accessible_dependent_derived_maps && context
          poro[:accessible_dependent_derived_maps] = derived_maps_to_presenter(context)
        end

        poro
      end

      def privacy_text(privacy)
        #TODO: This came from UserTable
        privacy == PRIVACY_LINK ? 'PUBLIC' : PRIVACY_VALUES_TO_TEXTS[privacy]
      end

      private

      attr_reader :show_size_and_row_count

      def derived_maps_to_presenter(context)
        visualizations = @user_table.accessible_dependent_derived_maps
        visualizations.map { |v| Carto::Api::VisualizationPresenter.new(v, @current_viewer, context).to_poro }
      end

    end
  end
end
