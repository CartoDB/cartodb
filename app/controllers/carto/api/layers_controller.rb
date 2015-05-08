module Carto
  module Api
    class LayersController < ::Api::ApplicationController

      ssl_required :index, :show
      before_filter :load_parent

      def index
        layers = Carto::Layer.joins(:layers_user).where(layers_users: { user_id: current_user.id })
                             .map { |layer|
          Carto::Api::LayerPresenter.new(layer, { viewer_user: current_user }).to_poro
        }

        render_jsonp layers: layers, total_entries: layers.size
      end

      protected

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

        Carto::Map.filter(id: params[:map_id]).first
      end

    end
  end
end
