module Carto
  module Api
    class StatesController < ::Api::ApplicationController
      include Carto::ControllerHelper

      ssl_required :show, :update

      before_filter :load_visualization
      before_filter :load_state, only: [:show, :update, :destroy]
      before_filter :check_viewable, only: [:index, :show]
      before_filter :check_writable, only: [:update, :destroy]
      before_filter :load_channel, only: [:create]

      rescue_from Carto::LoadError,
                  Carto::UnauthorizedError, with: :rescue_from_carto_error

      def index
        state_presentations = Carto::State.where(user_id: current_viewer.id).map do |state|
          Carto::Api::StatePresenter.new(state).to_hash
        end

        render_jsonp(state_presentations, 201)
      end

      def show
        render_jsonp(Carto::Api::StatePresenter.new(@state).to_hash)
      end

      def create
        state = Carto::State.create!(visualization_id: @visualization.id,
                                     user_id: @user.id,
                                     channel: @channel,
                                     json: params[:json])

        render_jsonp(Carto::Api::StatePresenter.new(state).to_poro, 201)
      end

      def update
        @state.json = params[:json]
        @state.save!

        render_jsonp(Carto::Api::StatePresenter.new(@state).to_hash)
      end

      def destroy
        @state.destroy

        render_jsonp({}, 204)
      end

      private

      def load_visualization
        visualization_id = params[:visualization_id]

        @visualization = Carto::Visualization.where(id: visualization_id).first if visualization_id
        raise Carto::LoadError.new("Visualization not found: #{visualization_id}") unless @visualization
      end

      def load_state
        state_id = params[:id]

        @state = Carto::State.where(id: state_id)
        raise Carto::LoadError.new("State not found: #{state}") unless @state
      end

      def check_viewable?
        raise Carto::UnauthorizedError.new unless @state.viewable_by?(current_viewer)
      end

      def check_writable?
        raise Carto::UnauthorizedError.new unless @state.writable_by?(current_viewer)
      end

      def load_channel
        @channel = if params[:channel] == Carto::State::PIRVATE_CHANNEL && @state.writable_by?(current_viewer)
                     Carto::State::PIRVATE_CHANNEL
                   else
                     Carto::State::PUBLIC_CHANNEL
                   end
      end
    end
  end
end
