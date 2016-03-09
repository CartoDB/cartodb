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
      before_filter :check_user_can_add_analysis, only: [:show, :create, :update, :destroy]
      before_filter :load_analysis, only: [:show, :update, :destroy]

      rescue_from StandardError, with: :rescue_from_standard_error
      rescue_from Carto::LoadError, with: :rescue_from_carto_error
      rescue_from Carto::UnauthorizedError, with: :rescue_from_carto_error
      rescue_from Carto::UnprocesableEntityError, with: :rescue_from_carto_error

      def show
        render_jsonp(AnalysisPresenter.new(@analysis).to_poro)
      end

      def create
        analysis_definition = analysis_definition_from_request

        analysis = Carto::Analysis.new(
          visualization_id: @visualization.id,
          user_id: current_user.id,
          analysis_definition: analysis_definition
        )
        analysis.save!
        render_jsonp(AnalysisPresenter.new(analysis).to_poro, 201)
      end

      def update
        @analysis.analysis_definition = analysis_definition_from_request
        @analysis.save!
        render_jsonp(AnalysisPresenter.new(@analysis).to_poro, 200)
      end

      def destroy
        @analysis.destroy
        render_jsonp(AnalysisPresenter.new(@analysis).to_poro, 200)
      end

      private

      def analysis_definition_from_request
        analysis_definition = request.raw_post
        raise Carto::UnprocesableEntityError.new("Analysis definition not present") unless analysis_definition.present?
        analysis_definition_json = begin
          JSON.parse(analysis_definition)
        rescue => e
          raise Carto::UnprocesableEntityError.new("Error parsing analysis definition: #{e.message}")
        end
        raise Carto::UnprocesableEntityError.new("Empty analysis definition") if analysis_definition_json.empty?

        analysis_definition
      end

      def load_visualization
        visualization_id = params[:visualization_id]

        @visualization = Carto::Visualization.where(id: visualization_id).first if visualization_id
        raise LoadError.new("Visualization not found: #{visualization_id}") unless @visualization
      end

      def check_user_can_add_analysis
        if @visualization.user_id != current_user.id
          raise Carto::UnauthorizedError.new("#{current_user.id} doesn't own visualization #{@visualization.id}")
        end
      end

      def load_analysis
        unless params[:id].nil?
          @analysis = Carto::Analysis.where(id: params[:id]).first if is_uuid?(params[:id])

          if @analysis.nil?
            @analysis = Carto::Analysis.find_by_natural_id(@visualization.id, params[:id])
          end
        end

        raise Carto::LoadError.new("Analysis not found: #{params[:id]}") unless @analysis
      end
    end
  end
end
