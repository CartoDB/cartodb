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
  end
end
