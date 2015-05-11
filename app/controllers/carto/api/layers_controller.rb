module Carto
  module Api
    class LayersController < ::Api::ApplicationController

      ssl_required :index, :show
      before_filter :load_parent

      def custom_layers_by_user
        Carto::Layer.joins(:layers_user).where(layers_users: { user_id: current_user.id })
      end

      def layers_by_map
        @parent.layers
      end

      def index
        layers = (params[:map_id] ? layers_by_map : custom_layers_by_user).map { |layer|
            Carto::Api::LayerPresenter.new(layer, { viewer_user: current_user }).to_poro
          }

        render_jsonp layers: layers, total_entries: layers.size
      end

      def show
        layer = @parent.layers.where(id: params[:id]).first
        raise RecordNotFound if layer.nil?
        
        render_jsonp Carto::Api::LayerPresenter.new(layer, { viewer_user: current_user }).to_json
      end


      protected

      # Serves also to detect 404s in scenarios where @parent is not used (like index action)
      def load_parent
        @parent = user_from(params) || map_from(params)
        raise RecordNotFound if @parent.nil?
      end

      def user_from(params={})
        current_user if params[:user_id]
      end

      def map_from(params={})
        return unless params[:map_id]

        # User must be owner or have permissions for the map's visualization
        vis = Carto::Visualization.where({
            user_id: current_user.id,
            map_id: params[:map_id]
          }).first
        raise RecordNotFound if vis.nil?

        Carto::Map.where(id: params[:map_id]).first
      end

    end
  end
end
