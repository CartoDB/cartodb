module Carto
  module Api
    class StatesController < ::Api::ApplicationController
      include Carto::ControllerHelper

      ssl_required :show, :update

      before_filter :load_visualization,
                    :owners_only, only: [:show, :update]

      rescue_from Carto::LoadError,
                  Carto::UnauthorizedError, with: :rescue_from_carto_error

      def show
        render_jsonp(@visualization.state)
      end

      def update
        @visualization.update_attributes(state: params[:state])
        @visualization.save!

        render_jsonp(@visualization.state)
      rescue => exception
        render json: { errors: exception.message }, status: 500
      end

      private

      def load_visualization
        visualization_id = params[:visualization_id]

        @visualization = Carto::Visualization.where(id: visualization_id).first if visualization_id
        raise Carto::LoadError.new("Visualization not found: #{visualization_id}") unless @visualization
      end

      def owners_only
        raise Carto::UnauthorizedError.new unless @visualization.is_writable_by_user(current_user)
      end
    end
  end
end
