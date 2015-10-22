require 'active_record'
require_relative '../shared_entity'

module Carto
  class SharedEntity < ActiveRecord::Base
    ENTITY_TYPE_VISUALIZATION = CartoDB::SharedEntity::ENTITY_TYPE_VISUALIZATION

    scope :shared_visualizations, where(entity_type: ENTITY_TYPE_VISUALIZATION)

    belongs_to :visualization, foreign_key: :entity_id, inverse_of: :shared_entities

    attr_accessible :entity_id, :recipient_id

    def self.columns
      super.reject { |c| c.name == "id" }
    end

  end
end
