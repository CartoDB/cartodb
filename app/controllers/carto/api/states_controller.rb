# encoding: utf-8

module Carto
  module Api
    class StatesController < ::Api::ApplicationController
      include Carto::ControllerHelper

      ssl_required :update

      before_filter :load_visualization,
                    :check_writer, only: :update

      rescue_from Carto::LoadError,
                  Carto::UnauthorizedError, with: :rescue_from_carto_error

      def update
        @visualization.state.json = params[:json]
        @visualization.save!

        render_jsonp(Carto::Api::StatePresenter.new(@visualization.state).to_hash)
      end

      private

      def load_visualization
        visualization_id = params[:visualization_id]

        @visualization = Carto::Visualization.where(id: visualization_id).first if visualization_id
        raise Carto::LoadError.new("Visualization not found: #{visualization_id}") unless @visualization
      end

      def check_writer
        raise Carto::UnauthorizedError.new unless @visualization.writable_by?(current_viewer)
      end
    end
  end
end
