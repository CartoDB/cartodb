# encoding utf-8

module Carto
  module Api
    class LegendsController < ::Api::ApplicationController
      include Carto::ControllerHelper

      ssl_required :index, :show, :create, :update, :destroy

      before_filter :load_layer,
                    :owners_only,
                    :ensure_under_max_legends
      before_filter :load_legend, only: [:show, :update, :destroy]

      rescue_from ActiveRecord::RecordNotFound do |exception|
        error = Carto::LoadError.new("#{exception.record.class.name.demodulize} not found")
        rescue_from_carto_error(error)
      end

      rescue_from ActiveRecord::RecordInvalid do |exception|
        error = Carto::UnprocesableEntityError.new(exception.record.errors.full_messages.join(', '))
        rescue_from_carto_error(error)
      end

      rescue_from Carto::LoadError,
                  Carto::UnauthorizedError,
                  Carto::UnprocesableEntityError,
                  Carto::UnauthorizedError, with: :rescue_from_carto_error

      MAX_LEGENDS_PER_LAYER = 2

      def index
        render_jsonp(@layer.legends.map(&:to_hash), :ok)
      end

      def show
        render_jsonp(@legend.to_hash, :ok)
      end

      def create
        legend = Carto::Legend.create!(legend_params.merge(layer_id: @layer.id))

        render_jsonp(legend.to_hash, :created)
      end

      def update
        @legend.update_attributes!(legend_params)

        render_jsonp(@legend.to_hash, :updated)
      end

      def destroy
        @legend.destroy!

        render_jsonp(@legend.to_hash, :destroyed)
      end

      private

      def load_layer
        @layer = Carto::Layer.find(params[:layer_id])

        unless @layer.data_layer?
          raise Carto::UnprocesableEntityError.new("'#{@layer.kind}' layers can't have legends")
        end
      end

      def owners_only
        unless Carto::Visualization.find(params[:visualization_id]).writable_by?(current_viewer)
          raise Carto::UnauthorizedError.new
        end
      end

      def ensure_under_max_legends
        unless @layer.legends.count < MAX_LEGENDS_PER_LAYER
          raise Carto::UnprocesableEntityError.new('Maximum number of legends per layer reached')
        end
      end

      def load_legend
        @legend = Carto::Legend.find(params[:id])
      end

      def legend_params
        params.slice(:title, :prehtml, :posthtml, :type, :definition)
      end
    end
  end
end
