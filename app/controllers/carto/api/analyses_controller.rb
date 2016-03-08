# encoding: utf-8
require_dependency 'carto/uuidhelper'
require_relative '../editor/editor_users_module'

module Carto
  module Api
    class AnalysesController < ::Api::ApplicationController
      include Carto::ControllerHelper
      include Carto::UUIDHelper
      include Carto::Editor::EditorUsersModule

      ssl_required :show, :create, :update, :destroy

      before_filter :editor_users_only
      before_filter :load_visualization
      before_filter :check_visualization_write_permission, only: [:create, :update, :destroy]
      before_filter :load_analysis, only: [:show, :update, :destroy]

      rescue_from Carto::LoadError, with: :rescue_from_carto_error
      rescue_from Carto::UnauthorizedError, with: :rescue_from_carto_error
      rescue_from Carto::UnprocesableEntityError, with: :rescue_from_carto_error

      def show
        render_jsonp(AnalysisPresenter.new(@analysis).to_poro)
      end

      def create
        analysis_params = params_from_request

        analysis = Carto::Analysis.new(
          visualization_id: @visualization.id,
          user_id: current_user.id,
          params: analysis_params
        )
        analysis.save!
        render_jsonp(AnalysisPresenter.new(analysis).to_poro, 201)
      end

      def update
        @analysis.params = params_from_request
        @analysis.save!
        render_jsonp(AnalysisPresenter.new(@analysis).to_poro, 200)
      end

      def destroy
        @analysis.destroy
        render_jsonp(AnalysisPresenter.new(@analysis).to_poro, 200)
      end

      private

      def params_from_request
        analysis_params = request.raw_post
        raise Carto::UnprocesableEntityError.new("Params not present") unless analysis_params.present?
        params_json = begin
          JSON.parse(analysis_params)
        rescue => e
          raise Carto::UnprocesableEntityError.new("Error parsing params: #{e.message}")
        end
        raise Carto::UnprocesableEntityError.new("Empty params") if params_json.empty?

        analysis_params
      end

      def load_visualization
        visualization_id = params[:visualization_id]

        @visualization = Carto::Visualization.where(id: visualization_id).first if visualization_id
        raise LoadError.new("Visualization not found: #{visualization_id}") unless @visualization
      end

      def check_visualization_write_permission
        if @visualization.user_id != current_user.id
          raise Carto::UnauthorizedError.new("#{current_user.id} doesn't own visualization #{@visualization.id}")
        end
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
