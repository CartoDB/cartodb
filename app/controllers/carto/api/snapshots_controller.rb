# encoding utf-8

module Carto
  class SnapshotsController < ::Api::ApplicationController
    before_filter :load_visualization

    rescue_from Carto::LoadError, with: :rescue_from_carto_error

    def index
      snapshots = State.where(visualization_id: @visualization.id,
                              user_id: current_viewer.try(:id))

      snapshots_presentation = snapshots.map do |snapshot|
        StatePresenter.new(snapshot).to_h
      end

      render json: snapshots_presentation, status: :ok
    end

    private

    def load_visualization
      @visualization = Carto::visualization.find(params[:visualization_id])
    rescue ActiveRecord::RecordNotFound
      raise Carto::LoadError.new('Visualization not found')
    end
  end
end
