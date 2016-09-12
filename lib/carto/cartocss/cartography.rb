# encoding utf-8

require 'singleton'

module Carto
  module CartoCSS
    class Cartography
      include Singleton

      CARTOGRAPHY_DEFAULT_FILE_PATH =
        "#{Rails.root}/lib/assets/javascripts/cartodb3/data/default-cartography.json".freeze

      def initialize
        @cartographies = {}
      end

      def load_from_file(file_path: CARTOGRAPHY_DEFAULT_FILE_PATH)
        return @cartographies[file_path] if @cartographies[file_path]

        cartography_file = File.read(file_path)

        @cartographies[file_path] = JSON.parse(cartography_file).with_indifferent_access
      rescue Errno::ENOENT
        return {}
      end
    end
  end
end
