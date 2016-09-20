# encoding utf-8

require 'json-schema'

require_dependency 'carto/definition'

module Carto
  class LegendDefinitionValidator
    VALIDATION_FORMAT_LOCATIONS_MAP = {
      bubble:     'lib/formats/legends/bubble.json',
      category:   'lib/formats/legends/category.json',
      choropleth: 'lib/formats/legends/choropleth.json',
      custom:     'lib/formats/legends/custom.json',
      html:       'lib/formats/legends/html.json'
    }.with_indifferent_access.freeze

    def self.errors(type, definition)
      raw_schema_location = VALIDATION_FORMAT_LOCATIONS_MAP[type]
      return ['could not be validated'] unless definition && raw_schema_location

      schema_location = "#{Rails.root}/#{raw_schema_location}"
      schema = Carto::Definition.instance.load_from_file(schema_location)

      JSON::Validator.fully_validate(schema, definition.with_indifferent_access)
    end
  end
end
