module Carto
  module Api
    class MapsController < ::Api::ApplicationController
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

      STRING_PARAMS = [:bounding_box_sw, :bounding_box_ne, :center, :view_bounds_sw, :view_bounds_ne].freeze

      def update_params
        update_params = params.slice(:bounding_box_ne,
                                     :bounding_box_sw,
                                     :center,
                                     :options,
                                     :provider,
                                     :view_bounds_ne,
                                     :view_bounds_sw,
                                     :zoom,
                                     :legends,
                                     :scrollwheel).permit!

        STRING_PARAMS.each do |param|
          update_params[param] = update_params[param].to_s
        end

        # Remove empty values, keeping `false`s (`present?` can't be used because of this)
        update_params.reject { |_k, v| v.nil? || v == '' }
      end

      def map_presentation
        Carto::Api::MapPresenter.new(@map).to_hash
      end
    end
  end
end
