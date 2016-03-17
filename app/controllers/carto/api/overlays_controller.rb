# encoding: UTF-8

require_dependency 'carto/controller_helper'

module Carto
  module Api
    class OverlaysController < ::Api::ApplicationController
      include Carto::ControllerHelper

      ssl_required :index, :show, :create, :update, :destroy

      before_filter :logged_users_only
      before_filter :load_visualization
      before_filter :check_current_user_has_permissions_on_vis
      before_filter :load_overlay, only: [:show, :update, :destroy]
      before_filter :check_overlay_is_in_visualization, only: [:show, :update, :destroy]

      rescue_from StandardError, with: :rescue_from_standard_error
      rescue_from Carto::CartoError, with: :rescue_from_carto_error

      def index
        collection = @visualization.overlays.map do |overlay|
          Carto::Api::OverlayPresenter.new(overlay).to_poro
        end
        render_jsonp(collection)
      end

      def show
        render_jsonp(Carto::Api::OverlayPresenter.new(@overlay).to_poro)
      end

      def create
        @stats_aggregator.timing('overlays.create') do
          begin
            overlay = Carto::Overlay.new(type:             params[:type],
                                         options:          params[:options],
                                         template:         params[:template],
                                         order:            params[:order],
                                         visualization_id: @visualization.id)

            saved = @stats_aggregator.timing('save') do
              overlay.save
            end
            if saved
              render_jsonp(Carto::Api::OverlayPresenter.new(overlay).to_poro)
            else
              render_jsonp({ errors: overlay.errors }, :unprocessable_entity)
            end
          end
        end
      end

      def update
        @stats_aggregator.timing('overlays.update') do
          begin
            @overlay.type =     params[:type]     if params[:type]
            @overlay.options =  params[:options]  if params[:options]
            @overlay.template = params[:template] if params[:template]
            @overlay.order =    params[:order]    if params[:order]

            saved = @stats_aggregator.timing('save') do
              @overlay.save
            end
            if saved
              render_jsonp(Carto::Api::OverlayPresenter.new(@overlay).to_poro)
            else
              render_jsonp({ errors: @overlay.errors }, :unprocessable_entity)
            end
          end
        end
      end

      def destroy
        @stats_aggregator.timing('overlays.destroy') do
          @stats_aggregator.timing('delete') do
            @overlay.destroy
          end
          head :no_content
        end
      end

      protected

      def logged_users_only
        raise Carto::UnauthorizedError.new if current_user.nil?
      end

      def load_visualization
        visualization_id = uuid_parameter('visualization_id')
        @visualization = Carto::Visualization.where(id: visualization_id).first
        raise Carto::LoadError.new("Visualization not found: #{visualization_id}") unless @visualization
      end

      def check_current_user_has_permissions_on_vis
        unless @visualization.is_writable_by_user(current_user)
          raise Carto::UnauthorizedError.new("#{current_user.id} doesn't own visualization #{@visualization.id}")
        end
      end

      def load_overlay
        overlay_id = uuid_parameter('id')
        @overlay = Carto::Overlay.where(id: overlay_id).first
        raise Carto::LoadError.new("Overlay not found: #{overlay_id}") unless @overlay
      end

      def check_overlay_is_in_visualization
        unless @overlay.visualization_id == @visualization.id
          raise Carto::LoadError.new("Overlay not in visualization: #{overlay_id} in viz #{@visualization.id}")
        end
      end
    end
  end
end
