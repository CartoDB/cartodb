# encoding utf-8

require '../definition'

module Carto::Forms
  class Point
    def initialize(geometry_type)
      super(geometry_type)
    end

    def self.accepted_geometries
      Carto::CartoCSS::Styles::Point.accepted_geometries
    end

    def to_hash
      return @hash if @hash

      merged_definition = style_definition
      merged_definition.each do |key, value|
        form_definition[key] = value if value.present?
      end

      @hash = merged_definition
    end

    private

    def form_definition
      return @form_definition if @form_definition

      @form_definition = Carto::Definition.load_from_file(DEFAULT_FORMS_DEFINITION_LOCATION)
    end

    def style_definition
      return @style_definition if @style_definition

      @style_definition = @style.default_definition
    end

    def style
      @style ||= Carto::CartoCSS::Styles::Point.new
    end
  end
end
