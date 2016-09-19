# encoding utf-8

require_relative './carto_json_serializer'
require_relative '../../controllers/carto/api/legend_presenter'
require_dependency 'carto/lengend_definition_validator'

module Carto
  class Legend < ActiveRecord::Base
    self.inheritance_column = :_type

    belongs_to :layer, class_name: Carto::Layer

    VALID_LEGEND_TYPES = %(html category bubble choropleth custom).freeze

    serialize :definition, ::Carto::CartoJsonSerializer

    validates :definition, carto_json_symbolizer: true
    validates :pre_html, :post_html, :type, :layer_id, presence: true
    validates :type, inclusion: { in: VALID_LEGEND_TYPES }, allow_nil: true

    validate :validate_definition_schema, :on_data_layer

    before_validation :ensure_definition

    def to_hash
      Carto::Api::LegendPresenter.to_hash(self)
    end

    private

    def ensure_definition
      self.definition ||= Hash.new
    end

    def validate_definition_schema
      return unless type && definition

      definition_errors = Carto::LegendDefinitionValidator.errors(type, definition)

      errors.add(:definition, definition_errors.join(', ')) if definition_errors.any?
    end

    def on_data_layer
      unless layer.data_layer?
        errors.add(:layer_id, "'#{layer.kind}' layers can't have legends")
      end
    end
  end
end
