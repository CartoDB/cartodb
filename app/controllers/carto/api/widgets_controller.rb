module Carto
  module Api
    class WidgetsController < ::Api::ApplicationController
      include Carto::ControllerHelper

      ssl_required :show, :create, :update, :destroy, :update_many

      before_filter :load_parameters, except: [:update_many]
      before_filter :load_map, only: [:update_many]
      before_filter :load_widget, only: [:show, :update, :destroy]

      rescue_from Carto::LoadError, with: :rescue_from_carto_error
      rescue_from Carto::UnauthorizedError, with: :rescue_from_carto_error
      rescue_from Carto::UnprocesableEntityError, with: :rescue_from_carto_error

      def show
        render_jsonp(WidgetPresenter.new(@widget).to_poro)
      end

      def create
        order_param = params[:order]
        order = if order_param.present?
                  order_param
                else
                  @map.visualization.widgets.count
                end
        widget = Carto::Widget.new(
          layer_id: @layer_id,
          order: order,
          type: params[:type],
          title: params[:title],
          options: params[:options],
          style: params[:style],
          source_id: source_id_from_params)
        widget.save!

        Carto::Tracking::Events::CreatedWidget.new(current_viewer.id,
                                                   user_id: current_viewer.id,
                                                   visualization_id: @layer.visualization.id,
                                                   widget_id: widget.id).report

        render_jsonp(WidgetPresenter.new(widget).to_poro, 201)
      rescue ActiveRecord::RecordInvalid
        render json: { errors: widget.errors }, status: 422
      rescue => e
        CartoDB::Logger.error(exception: e, message: "Error creating widget", widget: (widget ? widget : 'not created'))
        render json: { errors: e.message }, status: 500
      end

      def update
        update_widget!(@widget, params)

        render_jsonp(WidgetPresenter.new(@widget).to_poro)
      rescue => e
        CartoDB::Logger.error(exception: e, message: "Error updating widget", widget: @widget)
        render json: { errors: e.message }, status: 500
      end

      def update_many
        ActiveRecord::Base.transaction do
          result = params[:_json].map do |json_widget|
            widget = widget_with_validations(json_widget[:id])
            WidgetPresenter.new(update_widget!(widget, json_widget)).to_poro
          end
          render_jsonp(result)
        end
      end

      def destroy
        @widget.destroy

        render_jsonp(WidgetPresenter.new(@widget).to_poro)
      rescue => e
        CartoDB::Logger.error(exception: e, message: "Error destroying widget", widget: @widget)
        render json: { errors: e.message }, status: 500
      end

      private

      def update_widget!(widget, json_params)
        update_params = json_params.slice(:order, :type, :title)
        update_params[:source_id] = source_id_from_params(json_params) if source_id_from_params(json_params)
        widget.update_attributes(update_params)
        widget.options = json_params[:options]
        widget.style = json_params[:style]
        widget.save!
        widget.reload
      end

      def load_parameters
        load_map && load_layer && load_widget_id
      end

      def load_map
        @map_id = params[:map_id]
        @map = Carto::Map.where(id: @map_id).first
        raise LoadError.new("Map not found: #{@map_id}") unless @map
        raise Carto::UnauthorizedError.new("Not authorized for map #{@map.id}") unless @map.writable_by_user?(current_user)

        true
      end

      def load_layer
        @layer_id = params[:map_layer_id]
        payload_layer_id = params['layer_id']

        if [payload_layer_id, @layer_id].compact.uniq.length >= 2
          raise UnprocesableEntityError.new("URL layer id (#{@layer_id}) and payload layer id (#{payload_layer_id}) don't match")
        end

        @layer = Carto::Layer.where(id: @layer_id).first
        raise LoadError.new("Layer not found: #{@layer_id}") unless @layer

        raise UnprocesableEntityError.new("Layer #{@layer_id} doesn't belong to map #{@map_id}") unless @map.contains_layer?(@layer)

        true
      end

      def load_widget_id
        @widget_id = params[:id]
        if [@widget_id, params[:id]].compact.uniq.length >= 2
          raise UnprocesableEntityError.new("URL id (#{@widget_id}) and payload id (#{params[:id]}) don't match")
        end

        true
      end

      def source_id_from_params(parameters = params)
        parameters[:source] ? parameters[:source][:id] : nil
      end

      def load_widget
        @widget = widget_with_validations(@widget_id, @layer_id)
      end

      def widget_with_validations(widget_id, layer_id = nil)
        search_criteria = { id: widget_id}
        search_criteria.merge!(layer_id: layer_id) if layer_id
        widget = Carto::Widget.where(search_criteria).first

        raise Carto::LoadError.new("Widget not found: #{@widget_id}") unless widget
        raise Carto::LoadError.new("Widget not found: #{@widget_id} for that map (#{@map_id})") unless widget.belongs_to_map?(@map_id)
        raise Carto::UnauthorizedError.new("Not authorized for widget #{@widget_id}") unless widget.writable_by_user?(current_user)

        widget
      end
    end
  end
end
