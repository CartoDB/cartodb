# encoding utf-8

require_relative './carto_json_serializer'
require_dependency 'carto/lengend_definition_validator'

module Carto
  class Legend < ActiveRecord::Base
    self.inheritance_column = :_type

    VALID_LEGEND_TYPES = %(html category bubble choropleth custom).freeze

    serialize :definition, ::Carto::CartoJsonSerializer

    validates :definition, carto_json_symbolizer: true
    validates :type, inclusion: { in: VALID_LEGEND_TYPES }
    validates :prehtml, :posthtml, :definition, presence: true

    validate :validate_definition_schema

    def to_hash
      Carto::Api::LegendPresenter(self).to_hash
    end

    private

    def validate_definition_schema
      definition_errors = Carto::LegendDefinitionValidator.errors(type, definition)

      errors.add(:definition, definition_errors.join(', ')) if definition_errors.any?
    end
  end
end
