# encoding utf-8

module Carto
  module CartoCSS
    class Default
      GEOMETRY_TYPE_GEOMETRY = 'geometry'.freeze
      GEOMETRY_TYPE_MULTIPOLYGON = 'multipolygon'.freeze
      GEOMETRY_TYPE_POINT = 'point'.freeze
      GEOMETRY_TYPE_MULTILINESTRING = 'multilinestring'.freeze

      EMTPY_CARTOCSS = '#empty{}'.freeze

      CARTOGRAPHY_FILE_PATH =
        "#{Rails.root}/lib/assets/javascripts/cartodb3/data/default-cartography.json".freeze

      def initialize(geometry_type)
        @geometry_type = geometry_type
      end

      def default_carto_css
        EMTPY_CARTOCSS
      end

      private

      def cartography_json
        cartography_file = File.read(CARTOGRAPHY_FILE_PATH)

        JSON.parse(cartography_file).with_indifferent_access
      end
    end
  end
end
