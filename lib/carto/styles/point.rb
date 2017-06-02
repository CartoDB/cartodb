# encoding: utf-8

require_relative './style.rb'
require_relative '../definition.rb'

module Carto::Styles
  class Point < Style
    def initialize(definition: default_definition)
      super(definition)
    end

    def self.accepted_geometry_types
      ['point', 'multipoint', 'st_point']
    end

    def default_definition
      Carto::Definition.instance.load_from_file(CARTOGRAPHY_DEFINITION_LOCATION)[:simple][:point]
    end

    private

    def parse_fill(fill, style_type)
      width = fill[:size][:fixed]
      color = fill[:color][:fixed]
      opacity = fill[:color][:opacity]

      css = ["marker-width: #{width};",
        "marker-fill: #{color};",
        "marker-fill-opacity: #{opacity};"]

      if style_type == 'tvt'
        css = ["dot-width: #{width};",
         "dot-fill: #{color};",
         "dot-opacity: #{opacity};"]
      end

      css
    end

    def parse_stroke(stroke, style_type)
      return [] if style_type == 'tvt'

      width = stroke[:size][:fixed]
      color = stroke[:color][:fixed]
      opacity = stroke[:color][:opacity]

      ["marker-line-color: #{color};",
       "marker-line-width: #{width};",
       "marker-line-opacity: #{opacity};",
       "marker-placement: point;",
       "marker-type: ellipse;",
       "marker-allow-overlap: true;"]
    end
  end
end
