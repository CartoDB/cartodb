# encoding: utf-8
require_dependency 'carto/uuidhelper'
require_relative '../builder/builder_users_module'

module Carto
  module Api
    class AnalysesController < ::Api::ApplicationController
      include Carto::ControllerHelper
      include Carto::UUIDHelper
      include Carto::Builder::BuilderUsersModule

      ssl_required :show, :create, :update, :destroy

      before_filter :builder_users_only
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
        natural_id = analysis_definition_from_request['id']

        analysis = Carto::Analysis.find_by_natural_id(@visualization.id, natural_id)
        if analysis
          analysis.analysis_definition = analysis_definition_from_request
        else
          analysis = Carto::Analysis.new(
            visualization_id: @visualization.id,
            user_id: current_user.id,
            analysis_definition: analysis_definition_from_request
          )
        end
        analysis.save!
        render_jsonp(AnalysisPresenter.new(analysis).to_poro, 201)
      end

      def update
        new_definition = analysis_definition_from_request
        new_root_node = Carto::AnalysisNode.new(new_definition.deep_symbolize_keys)
        modified_node_ids = find_modified_nodes(@analysis.analysis_node, new_root_node)
        affected_node_ids = find_affected_nodes(modified_node_ids)

        @analysis.analysis_definition = new_definition
        @analysis.save!
        purge_layer_node_style_history(affected_node_ids)

        render_jsonp(AnalysisPresenter.new(@analysis).to_poro, 200)
      end

      def destroy
        @analysis.destroy
        render_jsonp(AnalysisPresenter.new(@analysis).to_poro, 200)
      end

      private

      def purge_layer_node_style_history(node_ids)
        Carto::LayerNodeStyle.from_visualization_and_source(@visualization, node_ids).delete_all
      end

      def find_affected_nodes(modified_node_ids)
        all_visualization_nodes = @visualization.analyses.map(&:analysis_node).map(&:descendants).flatten
        all_visualization_nodes.select { |node|
          node.descendants.any? { |descendant| modified_node_ids.include?(descendant.id) }
        }.map(&:id)
      end

      def find_modified_nodes(old_root, new_root)
        old_nodes = old_root.descendants
        new_nodes = new_root.descendants

        old_ids = old_nodes.map(&:id)
        new_ids = new_nodes.map(&:id)

        kept_ids = old_ids & new_ids
        kept_ids.select do |node_id|
          old_node = old_nodes.find { |n| n.id == node_id }
          new_node = new_nodes.find { |n| n.id == node_id }
          old_node.non_child_params != new_node.non_child_params
        end
      end

      def analysis_definition_from_request
        analysis_json = json_post(request.raw_post)

        if analysis_json.nil? || analysis_json.empty?
          raise Carto::UnprocesableEntityError.new("Empty analysis")
        end

        analysis_definition = analysis_json['analysis_definition']
        if analysis_definition.nil? || analysis_definition.empty? || analysis_definition.class == String
          raise Carto::UnprocesableEntityError.new("Invalid analysis definition")
        end

        analysis_definition
      end

      def json_post(raw_post = request.raw_post)
        @json_post ||= (raw_post.present? ? JSON.parse(raw_post) : nil)
      rescue => e
        # Malformed JSON is not our business
        CartoDB.notify_warning_exception(e)
        raise UnprocesableEntityError.new("Malformed JSON: #{raw_post}")
      end

      def load_visualization
        visualization_id = params[:visualization_id]

        if payload_visualization_id.present? && payload_visualization_id != visualization_id
          raise UnprocesableEntityError.new("url vis (#{visualization_id}) != payload (#{payload_visualization_id})")
        end

        @visualization = Carto::Visualization.where(id: visualization_id).first if visualization_id
        raise LoadError.new("Visualization not found: #{visualization_id}") unless @visualization
      end

      def payload_visualization_id
        json_post.present? ? json_post['visualization_id'] : nil
      end

      def payload_analysis_id
        json_post.present? ? json_post['id'] : nil
      end

      def check_user_can_add_analysis
        if @visualization.user_id != current_user.id
          raise Carto::UnauthorizedError.new("#{current_user.id} doesn't own visualization #{@visualization.id}")
        end
      end

      def load_analysis
        if payload_analysis_id.present? && payload_analysis_id != params[:id]
          raise UnprocesableEntityError.new("url analysis (#{params[:id]}) != payload (#{payload_analysis_id})")
        end

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
