# encoding utf-8

module Carto
  module Api
    class LegendsController < ::Api::ApplicationController
      include Carto::ControllerHelper

      ssl_required :index, :show, :create, :update, :destroy

      before_filter :load_layer,
                    :owners_only
      before_filter :load_legend, only: [:show, :update, :destroy]
      before_filter :ensure_under_max_legends, only: [:create, :update]

      rescue_from ActiveRecord::RecordNotFound do |exception|
        error_message = "#{exception.record.class.name.demodulize} not found"
        error = Carto::LoadError.new(error_message)

        rescue_from_carto_error(error)
      end

      rescue_from ActiveRecord::RecordInvalid do |exception|
        error_message = exception.record.errors.full_messages.join(', ')
        error = Carto::UnprocesableEntityError.new(error_message)

        rescue_from_carto_error(error)
      end

      rescue_from Carto::LoadError,
                  Carto::UnauthorizedError,
                  Carto::UnprocesableEntityError,
                  Carto::UnauthorizedError, with: :rescue_from_carto_error

      def index
        legend_presentations = @layer.legends.map do |legend|
          Carto::LegendPresenter.new(legend).to_hash
        end

        render_jsonp(legend_presentations, :ok)
      end

      def show
        legend_presentation = Carto::LegendPresenter.new(@legend).to_hash
        render_jsonp(legend_presentation, :ok)
      end

      def create
        legend_params_with_layer_id = legend_params.merge(layer_id: @layer.id)
        legend = Carto::Legend.create!(legend_params_with_layer_id)

        legend_presentation = Carto::LegendPresenter.new(legend).to_hash
        render_jsonp(legend_presentation, :created)
      end

      def update
        @legend.update_attributes!(legend_params)

        legend_presentation = Carto::LegendPresenter.new(@legend).to_hash
        render_jsonp(legend_presentation, :ok)
      end

      def destroy
        @legend.destroy

        render_jsonp({}, :no_content)
      end

      private

      def load_layer
        @layer = Carto::Layer.find(params[:layer_id])
      end

      def owners_only
        visualization = Carto::Visualization.find(params[:visualization_id])

        unless visualization.writable_by?(current_viewer)
          raise Carto::UnauthorizedError.new
        end
      end

      MAX_LEGENDS_PER_LAYER = 2

      def ensure_under_max_legends
        unless @layer.legends.count < MAX_LEGENDS_PER_LAYER
          message = 'Maximum number of legends per layer reached'
          raise Carto::UnprocesableEntityError.new(message)
        end
      end

      def load_legend
        @legend = Carto::Legend.find(params[:id])
      end

      def legend_params
        params.slice(:title, :pre_html, :post_html, :type, :definition)
      end

      def hash_for_legend(legend)
        Carto::LegendPresenter.new(legend).to_hash
      end
    end
  end
end
