require 'active_record'

module Carto
  class BiVisualization < ActiveRecord::Base

    belongs_to :bi_dataset, class_name: Carto::BiDataset

    def viz_json_json
      JSON.parse(viz_json)
    end

  end
end
