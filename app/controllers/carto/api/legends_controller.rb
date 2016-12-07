# encoding: utf-8

module Carto
  module Api
    class LegendsController < ::Api::ApplicationController
      include Carto::ControllerHelper

      ssl_required :index, :show, :create, :update, :destroy

      before_filter :load_layer,
                    :owners_only
      before_filter :load_legend, only: [:show, :update, :destroy]

      rescue_from Carto::LoadError,
                  Carto::UnauthorizedError,
                  Carto::UnprocesableEntityError, with: :rescue_from_carto_error

      def index
        legend_presentations = @layer.legends.map do |legend|
          LegendPresenter.new(legend).to_hash
        end

        render_jsonp(legend_presentations, :ok)
      end

      def show
        legend_presentation = LegendPresenter.new(@legend).to_hash
        render_jsonp(legend_presentation, :ok)
      end

      def create
        legend_params_with_layer_id = legend_params.merge(layer_id: @layer.id)
        legend = Legend.create(legend_params_with_layer_id)

        if legend.valid?
          legend_presentation = LegendPresenter.new(legend).to_hash
          render_jsonp(legend_presentation, :created)
        else
          error = legend.errors.full_messages.join(', ')
          raise Carto::UnprocesableEntityError.new(error)
        end
      end

      def update
        @legend.update_attributes!(legend_params)

        legend_presentation = LegendPresenter.new(@legend).to_hash
        render_jsonp(legend_presentation, :ok)
      rescue ActiveRecord::RecordInvalid
        error = @legend.errors.full_messages.join(', ')
        raise Carto::UnprocesableEntityError.new(error)
      end

      def destroy
        @legend.destroy

        render_jsonp({}, :no_content)
      end

      private

      def load_layer
        @layer = Carto::Layer.find(params[:layer_id])
      rescue ActiveRecord::RecordNotFound
        raise Carto::LoadError.new('Layer not found')
      end

      def owners_only
        visualization = Carto::Visualization.find(params[:visualization_id])

        unless visualization.layers.include?(@layer) &&
               visualization.writable_by?(current_viewer)
          raise Carto::UnauthorizedError.new
        end

      rescue ActiveRecord::RecordNotFound
        raise Carto::LoadError.new('Visualization not found')
      end

      def load_legend
        @legend = @layer.legends.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        raise Carto::LoadError.new('Legend not found')
      end

      def legend_params
        params.slice(:title, :pre_html, :post_html, :type, :definition, :conf)
      end
    end
  end
end
