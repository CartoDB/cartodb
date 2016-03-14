# encoding: UTF-8

require_dependency 'carto/uuidhelper'

module Carto
  module Api
    class OverlaysController < ::Api::ApplicationController
      include Carto::UUIDHelper

      ssl_required :index, :show
      before_filter :check_current_user_has_permissions_on_vis, only: [:index, :create]
      before_filter :check_current_user_owns_vis, only: [:show, :update, :destroy]

      def index
        collection = Carto::Overlay.where(visualization_id: params.fetch('visualization_id')).map do |overlay|
          Carto::Api::OverlayPresenter.new(overlay).to_poro
        end
        render_jsonp(collection)
      rescue KeyError
        head :not_found
      end

      def show
        overlay = Carto::Overlay.find(params.fetch('id'))
        render_jsonp(Carto::Api::OverlayPresenter.new(overlay).to_poro)
      rescue KeyError
        head :not_found
      end

      def create
        @stats_aggregator.timing('overlays.create') do
          begin
            overlay = Carto::Overlay.new(type:             params[:type],
                                         options:          params[:options],
                                         template:         params[:template],
                                         order:            params[:order],
                                         visualization_id: params[:visualization_id])

            saved = false
            @stats_aggregator.timing('save') do
              saved = overlay.save
            end
            if saved
              render_jsonp(Carto::Api::OverlayPresenter.new(overlay).to_poro)
            else
              render_jsonp({ errors: overlay.errors }, 400)
            end
          end
        end
      end

      def update
        @stats_aggregator.timing('overlays.update') do
          begin
            overlay = Carto::Overlay.find(params.fetch('id'))
            overlay.type =     params[:type]     if params[:type]
            overlay.options =  params[:options]  if params[:options]
            overlay.template = params[:template] if params[:template]
            overlay.order =    params[:order]    if params[:order]

            saved = false
            @stats_aggregator.timing('save') do
              saved = overlay.save
            end
            if saved
              render_jsonp(Carto::Api::OverlayPresenter.new(overlay).to_poro)
            else
              render_jsonp({ errors: overlay.errors }, 400)
            end
          rescue KeyError
            head :not_found
          end
        end
      end

      def destroy
        @stats_aggregator.timing('overlays.destroy') do
          overlay = Carto::Overlay.find(params.fetch('id'))
          @stats_aggregator.timing('delete') do
            overlay.destroy
          end
          head 204
        end
      end

      protected

      def check_current_user_owns_vis
        head 401 and return if current_user.nil?
        head 401 and return unless is_uuid?(params.fetch('id'))

        overlay = Carto::Overlay.where(id: params.fetch('id')).first
        head 401 and return if overlay.nil?

        vis = Carto::Visualization.where(id: overlay.visualization_id).first
        head 403 and return if vis.user_id != current_user.id
      end

      def check_current_user_has_permissions_on_vis
        head 401 and return if current_user.nil?
        head 401 and return unless is_uuid?(params.fetch('visualization_id'))

        vis = Carto::Visualization.where(id: params.fetch('visualization_id')).first
        head 401 and return if vis.nil?

        head 403 and return if !vis.is_writable_by_user(current_user)
      end

    end
  end
end
