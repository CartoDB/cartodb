require 'active_record'
require_relative '../shared_entity'

module Carto
  class SharedEntity < ActiveRecord::Base
    ENTITY_TYPE_VISUALIZATION = 'vis'.freeze

    RECIPIENT_TYPE_USER         = 'user'.freeze
    RECIPIENT_TYPE_ORGANIZATION = 'org'.freeze
    RECIPIENT_TYPE_GROUP        = 'group'.freeze

    scope :shared_visualizations, where(entity_type: ENTITY_TYPE_VISUALIZATION)

    belongs_to :visualization, foreign_key: :entity_id, inverse_of: :shared_entities

    validates :recipient_id, :recipient_type, :entity_id, :entity_type, presence: true
    validates :recipient_id, uniqueness: { scope: :entity_id, message: 'is already taken' }
    validate :supported_type

    attr_accessible :entity_id, :recipient_id, :entity_type, :recipient_type

    def self.columns
      super.reject { |c| c.name == "id" }
    end

    private

    def supported_type
      errors.add(:entity_type, 'unsupported type') unless self.entity_type == ENTITY_TYPE_VISUALIZATION
    end
  end
end
