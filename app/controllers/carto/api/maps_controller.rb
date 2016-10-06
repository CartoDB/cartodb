# encoding: UTF-8

module Carto
  module Api
    class MapsController < ::Api::ApplicationController
      include Carto::ControllerHelper

      ssl_required :show, :update

      before_filter :load_map, :owners_only

      rescue_from Carto::LoadError,
                  Carto::UnprocesableEntityError, with: :rescue_from_carto_error

      def show
        render_jsonp(map_presentation)
      end

      def update
        @map.update_attributes!(update_params)

        render_jsonp(map_presentation)
      rescue ActiveRecord::RecordInvalid
        validation_errors = @map.errors.full_messages.join(', ')
        raise Carto::UnprocesableEntityError.new(validation_errors)
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
        params.slice(:bounding_box_ne,
                     :bounding_box_sw,
                     :center,
                     :options,
                     :provider,
                     :view_bounds_ne,
                     :view_bounds_sw,
                     :zoom)
      end

      def map_presentation
        Carto::Api::MapPresenter.new(@map).to_hash
      end
    end
  end
end
