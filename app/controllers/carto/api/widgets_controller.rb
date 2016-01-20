module Carto
  module Api
    class WidgetsController < ::Api::ApplicationController
      include Carto::ControllerHelper

      ssl_required :show

      before_filter :load_parameters
      before_filter :load_widget

      rescue_from Carto::LoadError, with: :rescue_from_carto_error

      def show
        render_jsonp(@widget.attributes)
      end

      private

      def load_parameters
        @map_id = params[:map_id]
        @layer_id = params[:layer_id]
        @widget_id = params[:widget_id]
      end

      def load_widget
        @widget = Carto::Widget.where(layer_id: @layer_id, id: @widget_id).first

        if @widget
          @widget = nil unless @widget.belongs_to_map?(@map_id)
        end

        raise Carto::LoadError.new("Widget not found: #{@widget_id}") unless @widget
      end
    end
  end
end
