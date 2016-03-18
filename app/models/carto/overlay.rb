require 'active_record'

module Carto
  class Overlay < ActiveRecord::Base
    # INFO: disable ActiveRecord inheritance column
    self.inheritance_column = :_type

    belongs_to :visualization

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

    def unique_overlay_not_duplicated
      if visualization && UNIQUE_TYPES.include?(type)
        other_overlay = visualization.overlays.where(type: type)
        other_overlay = other_overlay.where('id != ?', id) unless new_record?

        unless other_overlay.first.nil?
          errors.add(:base, "Unique overlay of type #{type} already exists")
        end
      end
    end

    def invalidate_cache
      CartoDB::Visualization::Member.new(id: visualization_id).fetch.invalidate_cache
    rescue KeyError
      # This happens during creation, as the overlays are created before the visualization
    end
  end
end
