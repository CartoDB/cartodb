# encoding utf-8

require 'json-schema'

require_dependency 'carto/definition'

module Carto
  class LegendDefinitionValidator
    VALIDATION_FORMAT_LOCATIONS_MAP = {
      bubble:     'lib/formats/legends/bubble.json',
      category:   'lib/formats/legends/category_or_custom.json',
      choropleth: 'lib/formats/legends/choropleth.json',
      custom:     'lib/formats/legends/category_or_custom.json',
      html:       'lib/formats/legends/html.json'
    }.with_indifferent_access.freeze

    def self.errors(type, definition)
      schema_location = "#{Rails.root}/#{VALIDATION_FORMAT_LOCATIONS_MAP[type]}"
      return ['Definition could not be validated'] unless schema_location

      schema = Carto::Definition.instance.load_from_file(schema_location)

      JSON::Validator.fully_validate(schema, definition.with_indifferent_access)
    end
  end
end
