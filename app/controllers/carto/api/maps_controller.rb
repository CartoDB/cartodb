# encoding: UTF-8

module Carto
  module Api
    class MapsController < ::Api::ApplicationController
      ssl_required :show

      before_filter :load_map

      rescue_from Carto::LoadError,
                  Carto::UnauthorizedError,
                  Carto::UnprocesableEntityError, with: :rescue_from_carto_error

      def show
        render_jsonp(Carto::Api::MapPresenter.new(@map).to_poro)
      end

      private

      def load_map
        @map = Carto::Map.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        raise Carto::LoadError.new('Map not found')
      end

      def onwers_only
        unless @map.writable_by_user?(current_viewer)
          raise Carto::UnauthorizedError
        end
      end
    end
  end
end
