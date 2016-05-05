module Carto
  module Api
    class WidgetsController < ::Api::ApplicationController
      include Carto::ControllerHelper

      ssl_required :show, :create, :update, :destroy

      before_filter :load_parameters
      before_filter :load_widget, only: [:show, :update, :destroy]

      rescue_from Carto::LoadError, with: :rescue_from_carto_error
      rescue_from Carto::UnauthorizedError, with: :rescue_from_carto_error
      rescue_from Carto::UnprocesableEntityError, with: :rescue_from_carto_error

      def show
        render_jsonp(WidgetPresenter.new(@widget).to_poro)
      end

      def create
        widget = Carto::Widget.new(
          layer_id: @layer_id,
          order: Carto::Widget.where(layer_id: @layer_id).count + 1,
          type: params[:type],
          title: params[:title],
          options: params[:options],
          source_id: source_id_from_params)
        widget.save!
        render_jsonp(WidgetPresenter.new(widget).to_poro, 201)
      rescue => e
        CartoDB::Logger.error(exception: e, message: "Error creating widget", widget: (widget ? widget : 'not created'))
        render json: { errors: e.message }, status: 500
      end

      def update
        update_params = params.slice(:order, :type, :title)
        update_params[:source_id] = source_id_from_params if source_id_from_params
        @widget.update_attributes(update_params)
        @widget.options = params[:options] if params[:options]
        @widget.save!

        render_jsonp(WidgetPresenter.new(@widget).to_poro)
      rescue => e
        CartoDB::Logger.error(exception: e, message: "Error updating widget", widget: @widget)
        render json: { errors: e.message }, status: 500
      end

      def destroy
        @widget.destroy
        render_jsonp(WidgetPresenter.new(@widget).to_poro)
      rescue => e
        CartoDB::Logger.error(exception: e, message: "Error destroying widget", widget: @widget)
        render json: { errors: e.message }, status: 500
      end

      private

      def load_parameters
        @map_id = params[:map_id]
        @map = Carto::Map.where(id: @map_id).first
        raise LoadError.new("Map not found: #{@map_id}") unless @map
        raise Carto::UnauthorizedError.new("Not authorized for map #{@map.id}") unless @map.writable_by_user?(current_user)

        @layer_id = params[:map_layer_id]
        payload_layer_id = params['layer_id']

        if [payload_layer_id, @layer_id].compact.uniq.length >= 2
          raise UnprocesableEntityError.new("URL layer id (#{@layer_id}) and payload layer id (#{payload_layer_id}) don't match")
        end

        @layer = Carto::Layer.where(id: @layer_id).first
        raise LoadError.new("Layer not found: #{@layer_id}") unless @layer

        raise UnprocesableEntityError.new("Layer #{@layer_id} doesn't belong to map #{@map_id}") unless @map.contains_layer?(@layer)

        @widget_id = params[:id]
        if [@widget_id, params[:id]].compact.uniq.length >= 2
          raise UnprocesableEntityError.new("URL id (#{@widget_id}) and payload id (#{params[:id]}) don't match")
        end

        true
      end

      def source_id_from_params
        params[:source] ? params[:source][:id] : nil
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
