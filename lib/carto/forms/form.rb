# encoding utf-8

require_relative './definition'

module Carto
  module Forms
    class Form
      DEFAULT_FORMS_DEFINITION_LOCATION =
        "#{Rails.root}/lib/assets/javascripts/cartodb3/data/default-form-styles.json".freeze

      def initialize(geometry_type)
        @geometry_type = geometry_type
      end

      def to_hash
        @hash ||= generate_form_hash
      end

      private

      def style
        Carto::CartoCSS::Styles::Style.style_for_geometry_type(@geometry_type)
      end

      def generate_form_hash
        
      end

      def style_definition
        return @styles_definition if @styles_definition

        default_styles_definition_location =
          Carto::CartoCSS::Styles::Style::CARTOGRAPHY_DEFINITION_LOCATION

        @styles_definition = Carto::Definition.load_from_file(default_styles_definition_location)
      end

      def forms_definition
        return @forms_definition if @forms_definition

        @forms_definition = Carto::Definition.load_from_file(DEFAULT_FORMS_DEFINITION_LOCATION)
      end
    end
  end
end
