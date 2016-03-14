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
        payload_visualization_id = visualization_id_from_payload
        visualization_id = params[:visualization_id]

        if payload_visualization_id.present? && payload_visualization_id != visualization_id
          raise UnprocesableEntityError.new("url vis (#{visualization_id}) != payload (#{payload_visualization_id})")
        end

        @visualization = Carto::Visualization.where(id: visualization_id).first if visualization_id
        raise LoadError.new("Visualization not found: #{visualization_id}") unless @visualization
      end

      def visualization_id_from_payload
        request.raw_post.present? ? JSON.parse(request.raw_post)['visualization_id'] : nil
      rescue => e
        # Malformed JSON is not our business
        CartoDB.notify_warning_exception(e)
        raise UnprocesableEntityError.new("Malformed JSON: #{request.raw_post}")
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
