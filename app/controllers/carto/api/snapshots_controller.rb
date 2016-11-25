# encoding utf-8

module Carto
  module Api
    class SnapshotsController < ::Api::ApplicationController
      include Carto::ControllerHelper

      before_filter :load_visualization,
                    :check_visualization_viewable
      before_filter :load_snapshot,
                    :owners_only, only: [:show, :update, :destroy]

      rescue_from Carto::LoadError,
                  Carto::UnauthorizedError,
                  Carto::UnprocesableEntityError, with: :rescue_from_carto_error

      def index
        snapshots = State.where('id != ? AND ' \
                                'visualization_id = ? AND ' \
                                'user_id = ?',
                                @visualization.state.id,
                                @visualization.id,
                                current_viewer.try(:id))

        render json: StatePresenter.collection_to_hash(snapshots)
      end

      def show
        render json: StatePresenter.new(@snapshot).to_hash
      end

      def create
        snapshot = State.create!(user_id: current_viewer.try(:id),
                                 visualization_id: @visualization.id,
                                 json: params[:json])

        render json: StatePresenter.new(snapshot).to_hash, status: :created
      rescue ActiveRecord::RecordInvalid => exception
        message = exception.record.errors.full_messages.join(', ')
        raise Carto::UnprocesableEntityError.new(message)
      end

      def update
        @snapshot.update_attributes!(json: params[:json])

        render json: StatePresenter.new(@snapshot.reload).to_hash
      rescue ActiveRecord::RecordInvalid => exception
        message = exception.record.errors.full_messages.join(', ')
        raise Carto::UnprocesableEntityError.new(message)
      end

      def destroy
        @snapshot.destroy

        render json: Hash.new, status: :no_content
      end

      private

      def load_visualization
        @visualization = Carto::Visualization.find(params[:visualization_id])
      rescue ActiveRecord::RecordNotFound
        raise Carto::LoadError.new('Visualization not found')
      end

      def check_visualization_viewable
        unless @visualization.is_viewable_by_user?(current_viewer)
          raise Carto::UnauthorizedError.new
        end
      end

      def load_snapshot
        @snapshot = State.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        raise Carto::LoadError.new('Snapshot not found')
      end

      def owners_only
        unless @snapshot.user_id == current_viewer.id
          raise Carto::UnauthorizedError.new
        end
      end
    end
  end
end
