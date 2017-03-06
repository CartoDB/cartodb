# encoding: utf-8

module Carto
  module Api
    class StatesController < ::Api::ApplicationController
      include Carto::ControllerHelper

      ssl_required :update

      before_filter :load_visualization,
                    :check_writer, only: :update

      rescue_from LoadError,
                  UnauthorizedError,
                  UnprocesableEntityError, with: :rescue_from_carto_error

      def update
        @visualization.state.json = params[:json]
        @visualization.state.save!

        render json: StatePresenter.new(@visualization.state).to_hash
      rescue ActiveRecord::RecordInvalid
        message = @visualization.errors.full_messages.join(', ')
        raise UnprocesableEntityError.new(message)
      end

      private

      def load_visualization
        @visualization = Visualization.find(params[:visualization_id])
      rescue ActiveRecord::RecordNotFound
        raise LoadError.new('Visualization not found')
      end

      def check_writer
        unless @visualization.writable_by?(current_viewer)
          raise UnauthorizedError.new
        end
      end
    end
  end
end
