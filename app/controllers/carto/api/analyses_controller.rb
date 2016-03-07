# encoding: utf-8
require_dependency 'carto/uuidhelper'

module Carto
  module Api
    class AnalysesController < ::Api::ApplicationController
      include Carto::ControllerHelper
      include Carto::UUIDHelper

      ssl_required :show

      before_filter :load_visualization
      before_filter :load_analysis, only: [:show]

      rescue_from Carto::LoadError, with: :rescue_from_carto_error
      rescue_from Carto::UnauthorizedError, with: :rescue_from_carto_error
      rescue_from Carto::UnprocesableEntityError, with: :rescue_from_carto_error

      def show
        render_jsonp(AnalysisPresenter.new(@analysis).to_poro)
      end

      def create
        analysis_params = request.raw_post
        analysis = Carto::Analysis.new(
          visualization_id: @visualization.id,
          user_id: current_user.id,
          params: analysis_params
        )
        analysis.save!
        render_jsonp(AnalysisPresenter.new(analysis).to_poro, 201)
      end

      private

      def load_visualization
        visualization_id = params[:visualization_id]

        @visualization = Carto::Visualization.where(id: visualization_id).first if visualization_id
        raise LoadError.new("Visualization not found: #{visualization_id}") unless @visualization
      end

      def load_analysis
        unless params[:id].nil?
          if is_uuid?(params[:id])
            @analysis_id = params[:id]
          end
        end

        if !@analysis_id.nil?
          @analysis = Carto::Analysis.where(id: @analysis_id).first
        end

        if @analysis.nil? && !params[:id].nil? && !@visualization.id.nil?
          # If it's an UUID it can be a natural id as well
          @analysis = Carto::Analysis.find_by_natural_id(@visualization.id, params[:id])
        end

        raise Carto::LoadError.new("Analysis not found: #{@analysis_id}") unless @analysis
      end
    end
  end
end
