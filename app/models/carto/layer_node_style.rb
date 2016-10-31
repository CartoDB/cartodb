class Carto::LayerNodeStyle < ActiveRecord::Base
  belongs_to :layer

  def self.from_visualization_and_source(visualization, source_id)
    Carto::LayerNodeStyle.where(layer_id: visualization.data_layers.map(&:id), source_id: source_id).all
  end
end
