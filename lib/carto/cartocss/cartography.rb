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
        message = 'Carto::CartoCSS::Cartography: Couldn\'t read from file'
        CartoDB::Logger.error(message: message, file_path: file_path)

        raise message
      end
    end
  end
end
