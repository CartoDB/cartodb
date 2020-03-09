require 'active_record'
require_dependency 'carto/visualization_backup_service'

module Carto
  class LayersMap < ActiveRecord::Base
    include Carto::VisualizationBackupService

    belongs_to :layer, class_name: Carto::Layer
    belongs_to :map, class_name: Carto::Map

    before_destroy :backup_visualization
    after_destroy :invalidate_map, :destroy_layer

    private

    def invalidate_map
      map.notify_map_change if map
    end

    def destroy_layer
      # Destroy the actual layer when removing it from the map (as layers cannot be in multiple maps)
      # This is a workaround for a bug in Rails 4 (https://github.com/rails/rails/issues/13609)
      # A better way to do this is with `dependent: :destroy` on the association
      return if @layer_destroyed || layer.destroyed?
      @layer_destroyed = true
      layer.destroy
    end

    def backup_visualization
      return if !map.visualization || map.visualization.destroyed? || @layer_destroyed || layer.destroyed?
      create_visualization_backup(
        visualization: map.visualization,
        category: Carto::VisualizationBackup::CATEGORY_LAYER
      )
    end
  end
end
