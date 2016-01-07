require 'active_record'
require 'json'

module Carto
  class BiVisualization < ActiveRecord::Base

    belongs_to :bi_dataset, class_name: Carto::BiDataset

    def viz_json_json
      JSON.parse(viz_json).symbolize_keys
    end

    def accessible_by?(user)
      bi_dataset.accessible_by?(user)
    end

    def extract_value_from_viz_json(key)
      JSON.load(viz_json)[key]
    end
  end
end
