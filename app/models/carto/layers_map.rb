# encoding: utf-8

require 'active_record'

module Carto
  class LayersMap < ActiveRecord::Base
    # Destroy the actual layer when removing it from the map (as layers cannot be in multiple maps)
    belongs_to :layer, class_name: Carto::Layer, dependent: :destroy
    belongs_to :map, class_name: Carto::Map

    after_destroy :invalidate_map

    private

    def invalidate_map
      map.notify_map_change if map
    end
  end
end
