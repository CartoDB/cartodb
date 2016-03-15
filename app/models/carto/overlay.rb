require 'active_record'

module Carto
  class Overlay < ActiveRecord::Base
    # INFO: disable ActiveRecord inheritance column
    self.inheritance_column = :_type

    serialize :options, JSON

    validates :visualization_id, presence: true
    validates :type, presence: true
    validate :unique_overlay_not_duplicated

    after_save :invalidate_cache
    after_destroy :invalidate_cache

    # There can be at most one of this types per visualization
    UNIQUE_TYPES = [
      'header', 'search', 'layer_selector', 'share', 'zoom', 'logo', 'loader', 'fullscreen'
    ].freeze

    def hide
      options['display'] = false
      self
    end

    def show
      options['display'] = true
      self
    end

    def hidden?
      !options['display']
    end

    private

    def visualization
      CartoDB::Visualization::Member.new(id: visualization_id).fetch
    end

    def unique_overlay_not_duplicated
      vis = visualization
      if vis && UNIQUE_TYPES.include?(type)
        vis.overlays.each do |overlay|
          if (new_record? || overlay.id != id) && overlay.type == type
            errors.add(:base, "Unique overlay of type #{type} already exists")
          end
        end
      end
    rescue KeyError
      # Scenario of not yet having stored the vis
    end

    def invalidate_cache
      visualization.invalidate_cache
    rescue KeyError
      # Scenario of not yet having stored the vis
    end
  end
end
