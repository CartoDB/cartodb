# encoding: UTF-8

module Carto
  module Api
    class MapsController < ::Api::ApplicationController

      ssl_required :show

      before_filter :load_map

      def show
        render_jsonp(Carto::Api::MapPresenter.new(@map).to_poro)
      end

      protected

      def load_map
        raise RecordNotFound unless is_uuid?(params[:id])

        # User must be owner or have permissions for the map's visualization
        vis = Carto::Visualization.where({
            user_id: current_user.id,
            map_id: params[:id],
            kind: Carto::Visualization::KIND_GEOM
          }).first
        raise RecordNotFound if vis.nil?

        @map = Carto::Map.where(id: params[:id]).first
        raise RecordNotFound if @map.nil?
      end

      # TODO: remove this method and use  app/helpers/carto/uuidhelper.rb. Not used yet because this changed was pushed before
      def is_uuid?(text)
        !(Regexp.new(%r{\A#{UUIDTools::UUID_REGEXP}\Z}) =~ text).nil?
      end

    end
  end
end
