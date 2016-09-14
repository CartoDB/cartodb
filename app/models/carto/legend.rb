# encoding utf-8

require_relative './carto_json_serializer'

module Carto
  class Legend < ActiveRecord::Base
    VALID_LEGEND_TYPES = %(html category bubble choropleth custom).freeze
    VALID_DEFINITION_KEYS = [].freeze # Note: Should be overriden by child classes

    serialize :definition, ::Carto::CartoJsonSerializer

    validates :definition, carto_json_symbolizer: true
    validates :type, inclusion: { in: VALID_LEGEND_TYPES }
    validates :prehtml, :posthtml, presence: true
    validate :validate_definition

    def html?
      type == 'html'
    end

    def category?
      type == 'category'
    end

    def bubble?
      type == 'bubble'
    end

    def choropleth?
      type == 'choropleth'
    end

    def custom?
      type == 'custom'
    end

    private

    # Note: may be overriden or extendend by child classes
    def validate_definition
      missing_keys = VALID_DEFINITION_KEYS - definition.keys
      exceeding_keys = definition.keys - VALID_DEFINITION_KEYS

      if missing_keys.empty? && exceeding_keys.emtpy?
        true
      elsif missing_keys.any?
        errors.add(:definition, "Missing keys: #{missing.join(', ')}")
      elsif exceeding_keys.any?
        errors.add(:definition, "Exceeding keys: #{exceeding_keys.join(', ')}")
      end

      false
    end
  end
end
