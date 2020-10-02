module Carto
  module Api
    class SnapshotsController < ::Api::ApplicationController

      include ControllerHelper

      ssl_required :index, :show, :create, :update, :destroy

      before_filter :load_visualization,
                    :check_visualization_viewable
      before_filter :load_snapshot,
                    :owners_only, only: [:show, :update, :destroy]

      rescue_from LoadError,
                  UnauthorizedError,
                  UnprocesableEntityError, with: :rescue_from_carto_error

      def index
        snapshots = @visualization.snapshots.where(user_id: current_viewer.id)

        presentation = snapshots.map do |snapshot|
          SnapshotPresenter.new(snapshot).to_hash
        end

        render json: presentation
      end

      def show
        render json: SnapshotPresenter.new(@snapshot).to_hash
      end

      def create
        snapshot = Snapshot.create!(user_id: current_viewer.id,
                                    visualization_id: @visualization.id,
                                    state: params[:state])

        render json: SnapshotPresenter.new(snapshot).to_hash, status: :created
      rescue ActiveRecord::RecordInvalid => e
        message = e.record.errors.full_messages.join(', ')
        raise UnprocesableEntityError.new(message)
      end

      def update
        @snapshot.update_attributes!(state: params[:state])

        render json: SnapshotPresenter.new(@snapshot).to_hash
      rescue ActiveRecord::RecordInvalid => e
        message = e.record.errors.full_messages.join(', ')
        raise UnprocesableEntityError.new(message)
      end

      def destroy
        @snapshot.destroy

        render json: {}, status: :no_content
      end

      private

      def load_visualization
        @visualization = Visualization.find(params[:visualization_id])
      rescue ActiveRecord::RecordNotFound
        raise LoadError.new('Visualization not found')
      end

      def check_visualization_viewable
        raise UnauthorizedError.new unless @visualization.is_viewable_by_user?(current_viewer)
      end

      def load_snapshot
        @snapshot = Snapshot.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        raise LoadError.new('Snapshot not found')
      end

      def owners_only
        raise UnauthorizedError.new unless @snapshot.user_id == current_viewer.id
      end

    end
  end
end
