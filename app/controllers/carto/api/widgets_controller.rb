module Carto
  module Api
    class WidgetsController < ::Api::ApplicationController
      include Carto::ControllerHelper

      ssl_required :show

      before_filter :load_parameters
      before_filter :load_widget

      rescue_from Carto::LoadError, with: :rescue_from_carto_error

      def show
        render_jsonp({})
      end

      private

      def load_parameters
        @visualization_id = params[:visualization_id]
        @layer_id = params[:layer_id]
        @widget_id = params[:widget_id]
      end

      def load_widget
        raise Carto::LoadError.new("Widget not found: #{@widget_id}")
      end
    end
  end
end
