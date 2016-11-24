# encoding utf-8

module Carto
  class SnapshotsController < ::Api::ApplicationController
    include Carto::ControllerHelper

    before_filter :load_visualization,
                  :check_accessible
    before_filter :load_snapshot, only: [:show, :update, :destroy]

    rescue_from Carto::LoadError,
                Carto::UnauthorizedError, with: :rescue_from_carto_error

    def index
      snapshots = State.where(visualization_id: @visualization.id,
                              user_id: current_viewer.try(:id))

      snapshots_presentation = snapshots.map do |snapshot|
        StatePresenter.new(snapshot).to_h
      end

      render json: snapshots_presentation
    end

    def show
      render json: StatePresenter.new(@snapshot).to_hash
    end

    private

    def load_visualization
      @visualization = Carto::visualization.find(params[:visualization_id])
    rescue ActiveRecord::RecordNotFound
      raise Carto::LoadError.new('Visualization not found')
    end

    def check_accessible
      unless @visualization.is_viewable_by_user?(current_viewer)
        raise Carto::UnauthorizedError.new
      end
    end

    def load_snapshot
      @snapshot = State.find(params[:snapshot_id])
    rescue ActiveRecord::RecordNotFound
      raise Carto::LoadError.new('Snapshot not found')
    end
  end
end
