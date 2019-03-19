# encoding: utf-8

require 'active_record'

module Carto
  class LayersMap < ActiveRecord::Base
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
      return if @layer_destroyed || layer.destroyed?
      map.visualization.backup_visualization(Carto::VisualizationBackup::CATEGORY_LAYER) if map.visualization
    end
  end
end
