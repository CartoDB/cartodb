
require_dependency 'carto/uuidhelper'

module Carto
  module Api
    class LayersController < ::Api::ApplicationController
      include Carto::ControllerHelper

      ssl_required :show, :layers_by_map, :custom_layers_by_user

      before_filter :ensure_current_user, only: [:custom_layers_by_user, :show_for_user]
      before_filter :load_map, only: [:layers_by_map, :show_for_map]
      before_filter :load_user_layer, only: [:show_for_user]
      before_filter :load_map_layer, only: [:show_for_map]

      rescue_from LoadError,
                  UnprocesableEntityError,
                  UnauthorizedError, with: :rescue_from_carto_error

      def layers_by_map
        layers = @map.layers.map do |layer|
          Carto::Api::LayerPresenter.new(layer, viewer_user: current_user, user: owner_user(layer)).to_poro
        end

        render_jsonp layers: layers, total_entries: layers.size
      end

      def custom_layers_by_user
        layers = @user.layers.map do |layer|
          Carto::Api::LayerPresenter.new(layer, viewer_user: @user, user: @user).to_poro
        end
        render_jsonp layers: layers, total_entries: layers.size
      end

      def show_for_user
        show(current_user)
      end

      def show_for_map
        show(@map.user)
      end

      private

      def show(owner)
        render_jsonp Carto::Api::LayerPresenter.new(@layer, viewer_user: current_user, user: owner).to_json
      end

      def ensure_current_user
        user_id = uuid_parameter(:user_id)
        raise UnauthorizedError unless current_user.id == user_id
        @user = Carto::User.find(user_id)
      end

      def load_user_layer
        layer_id = uuid_parameter(:id)
        @layer = @user.layers.find(layer_id)
      rescue ActiveRecord::RecordNotFound
        raise LoadError.new('Layer not found')
      end

      def load_map
        map_id = uuid_parameter(:map_id)

        # User must be owner or have permissions for the map's visualization
        @map = Carto::Map.find(map_id)
        vis = @map.visualization
        raise LoadError.new('Map not found') unless vis && vis.is_viewable_by_user?(current_user)
      rescue ActiveRecord::RecordNotFound
        raise LoadError.new('Map not found')
      end

      def load_map_layer
        layer_id = uuid_parameter(:id)
        @layer = @map.layers.find(layer_id)
      rescue ActiveRecord::RecordNotFound
        raise LoadError.new('Layer not found')
      end

      def owner_user(layer)
        if current_user.nil? || @map.user.id != current_user.id
          # This keeps backwards compatibility with map user assignment. See #8974
          @map.user
        elsif layer.options && layer.options['user_name'].present?
          ::User.where(username: layer.options['user_name']).first
        else
          layer.user
        end
      end

    end
  end
end
