# encoding utf-8

module Carto
  class SnapshotsController < ::Api::ApplicationController
    before_filter :load_visualization

    rescue_from Carto::LoadError, with: :rescue_from_carto_error

    private

    def load_visualization
      @visualization = Carto::visualization.find(params[:visualization_id])
    rescue ActiveRecord::RecordNotFound
      raise Carto::LoadError.new('Visualization not found')
    end
  end
end
