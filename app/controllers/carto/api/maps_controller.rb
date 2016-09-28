# encoding: UTF-8

module Carto
  module Api
    class MapsController < ::Api::ApplicationController
      include Carto::ControllerHelper

      ssl_required :show, :update

      before_filter :load_map, :owners_only

      rescue_from Carto::LoadError,
                  Carto::UnauthorizedError,
                  Carto::UnprocesableEntityError, with: :rescue_from_carto_error

      def show
        render_jsonp(map_presentation)
      end

      def update
        @map.show_menu = show_menu if show_menu
        @map.update_attributes!(update_params)

        render_jsonp(map_presentation)
      end

      private

      def load_map
        @map = Carto::Map.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        raise Carto::LoadError.new('Map not found')
      end

      def owners_only
        unless @map.writable_by_user?(current_viewer)
          raise Carto::LoadError.new('Map not found')
        end
      end

      def update_params
        @update_params ||= params.slice(:bounding_box_ne,
                                        :bounding_box_sw,
                                        :center,
                                        :legends,
                                        :provider,
                                        :scrollwheel,
                                        :view_bounds_ne,
                                        :view_bounds_sw,
                                        :zoom)
      end

      def show_menu
        @show_menu ||= params.slice(:show_menu)
      end

      def map_presentation(map: @map)
        Carto::Api::MapPresenter.new(map).to_hash
      end
    end
  end
end
