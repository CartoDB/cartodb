# encoding: utf-8

require 'json-schema'

require_dependency 'carto/definition'

module Carto
  class LegendDefinitionValidator
    def initialize(type, definition)
      @type = type
      @definition = definition.with_indifferent_access if definition
    end

    def errors
      return @errors if @errors
      return ['could not be validated'] unless @definition && location

      schema = Carto::Definition.instance.load_from_file(location)
      @errors = JSON::Validator.fully_validate(schema, @definition)
    end

    private

    LEGEND_FORMATS_LOCATION = 'lib/formats/legends/definitions'.freeze

    def location
      return @location if @location
      location = "#{Rails.root}/#{LEGEND_FORMATS_LOCATION}/#{@type}.json"

      @location = location if File.exists?(location)
    end
  end
end
