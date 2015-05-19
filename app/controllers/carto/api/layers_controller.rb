module Carto
  module Api
    class LayersController < ::Api::ApplicationController

      ssl_required :show, :layers_by_map, :custom_layers_by_user

      before_filter :owner_from_params, only: [ :custom_layers_by_user, :show ]
      before_filter :map_from_params, only: [ :layers_by_map, :show ]

      def layers_by_map
        raise RecordNotFound if @parent.nil?

        layers = @parent.layers(@parent).map { |layer|
            Carto::Api::LayerPresenter.new(layer, current_user, @parent.user).to_poro
          }

        render_jsonp layers: layers, total_entries: layers.size
      end

      def custom_layers_by_user
        raise RecordNotFound if @owner_user.nil?

        layers = Carto::Layer.joins(:layers_user).where(layers_users: { user_id: current_user.id })
        layers = layers.map { |layer|
            Carto::Api::LayerPresenter.new(layer, current_user, @owner_user).to_poro
          }

        render_jsonp layers: layers, total_entries: layers.size
      end

      def show
        raise RecordNotFound unless is_uuid?(params[:id])
        raise RecordNotFound if (@owner_user.nil? && @parent.nil?)

        parent = @parent ? @parent : @owner_user
        layer = parent.layers.where(id: params[:id]).first
        raise RecordNotFound if layer.nil?
        
        render_jsonp Carto::Api::LayerPresenter.new(layer, current_user).to_json
      end

      protected

      def owner_from_params
         @owner_user = current_user if (params[:user_id] && is_uuid?(params[:user_id]))
      end

      def map_from_params
        return if (!params[:map_id] || !is_uuid?(params[:map_id]))

        # User must be owner or have permissions for the map's visualization
        vis = Carto::Visualization.where({
            map_id: params[:map_id]
          }).first
        raise RecordNotFound if vis.nil? || !vis.is_viewable_by_user?(current_user)

        @parent = Carto::Map.where(id: params[:map_id]).first
      end

      # TODO: remove this method and use  app/helpers/carto/uuidhelper.rb. Not used yet because this changed was pushed before
      def is_uuid?(text)
        !(Regexp.new(%r{\A#{UUIDTools::UUID_REGEXP}\Z}) =~ text).nil?
      end

    end
  end
end
