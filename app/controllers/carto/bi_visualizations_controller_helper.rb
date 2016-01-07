module Carto
  module BiVisualizationsControllerHelper

    def load_parameters
      @bi_visualization_id = uuid_parameter(:id)
    end

    def load_bi_visualization
      @bi_visualization = Carto::BiVisualization.find(@bi_visualization_id)
      raise Carto::UnauthorizedError.new unless @bi_visualization.accessible_by?(current_user)
    rescue ActiveRecord::RecordNotFound
      raise Carto::LoadError.new("BiVisualization not found: #{@bi_visualization_id}")
    end

    def load_bi_visualizations
      @bi_visualizations = Carto::BiVisualization.joins(:bi_dataset).where(bi_datasets: { user_id: current_user.id })
    end
  end
end
