# encoding utf-8

module Carto
  module Api
    class StateController < ::Api::ApplicationController
      include Carto::ControllerHelper

      ssl_required :update

      before_filter :load_visualization,
                    :check_writer,
                    :load_state, only: :update

      rescue_from Carto::LoadError,
                  Carto::UnauthorizedError, with: :rescue_from_carto_error

      def update
        @state.json = params[:json]
        @state.save!

        render_jsonp(Carto::Api::StatePresenter.new(@state).to_hash)
      end

      private

      def load_visualization
        visualization_id = params[:visualization_id]

        @visualization = Carto::Visualization.where(id: visualization_id).first if visualization_id
        raise Carto::LoadError.new("Visualization not found: #{visualization_id}") unless @visualization
      end

      def check_writer
        @visualization.is_writable_by_user?(current_viewer)
      end

      def load_state
        @state = @visualization.state
      end
    end
  end
end
