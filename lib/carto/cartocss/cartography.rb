# encoding utf-8

module Carto
  module CartoCSS
    class Cartography
      CARTOGRAPHY_DEFAULT_FILE_PATH =
        "#{Rails.root}/lib/assets/javascripts/cartodb3/data/default-cartography.json".freeze

      def initialize(file_path: CARTOGRAPHY_DEFAULT_FILE_PATH)
        @file_path = file_path
      end

      def to_hash
        return @cartography if @cartography

        cartography_file = File.read(@file_path)

        @cartography = JSON.parse(cartography_file).with_indifferent_access
      end
    end
  end
end
