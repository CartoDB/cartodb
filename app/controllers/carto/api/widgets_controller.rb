module Carto
  module Api
    class WidgetsController < ::Api::ApplicationController
      include Carto::ControllerHelper

      ssl_required :show, :create

      before_filter :load_parameters
      before_filter :load_widget, only: [:show]

      rescue_from Carto::LoadError, with: :rescue_from_carto_error
      rescue_from Carto::UnauthorizedError, with: :rescue_from_carto_error

      def show
        render_jsonp(@widget.attributes)
      end

      def create
        widget = Carto::Widget.new(
          layer_id: params[:layer_id],
          order: 1,
          type: params[:type],
          title: params[:title],
          dataview: params[:dataview].to_json)
        widget.save!
        render_jsonp(widget.attributes, 201)
      end

      private

      def load_parameters
        @map_id = params[:map_id]
        @layer_id = params[:layer_id]
        @widget_id = params[:widget_id]

        true
      end

      def load_widget
        @widget = Carto::Widget.where(layer_id: @layer_id, id: @widget_id).first

        raise Carto::LoadError.new("Widget not found: #{@widget_id}") unless @widget
        raise Carto::LoadError.new("Widget not found: #{@widget_id} for that map (#{@map_id})") unless @widget.belongs_to_map?(@map_id)
        raise Carto::UnauthorizedError.new("Not authorized for widget #{@widget_id}") unless @widget.writable_by_user?(current_user)

        true
      end
    end
  end
end
