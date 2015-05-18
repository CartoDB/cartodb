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
            Carto::Api::LayerPresenter.new(layer, current_user, { viewer_user: current_user }).to_poro
          }
        render_jsonp layers: layers, total_entries: layers.size
      end

      def show
        raise RecordNotFound unless is_uuid?(params[:id]) 

        layer = @parent.layers.where(id: params[:id]).first
        raise RecordNotFound if layer.nil?
        render_jsonp Carto::Api::LayerPresenter.new(layer, current_user, { viewer_user: current_user }).to_json
      end


      protected

      # Serves also to detect 404s in scenarios where @parent is not used (like index action)
      def load_parent
        @parent = user_from(params) || map_from(params)
        raise RecordNotFound if @parent.nil?
      end

      def user_from(params={})
        current_user if (params[:user_id] && is_uuid?(params[:user_id]))
      end

      def map_from(params={})
        return if (!params[:map_id] || !is_uuid?(params[:map_id]))

        # User must be owner or have permissions for the map's visualization
        vis = Carto::Visualization.where({
            user_id: current_user.id,
            map_id: params[:map_id]
          }).first
        raise RecordNotFound if vis.nil?

        Carto::Map.where(id: params[:map_id]).first
      end

      # TODO: remove this method and use  app/helpers/carto/uuidhelper.rb. Not used yet because this changed was pushed before
      def is_uuid?(text)
        !(Regexp.new(%r{\A#{UUIDTools::UUID_REGEXP}\Z}) =~ text).nil?
      end

    end
  end
end
