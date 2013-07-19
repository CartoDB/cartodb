# encoding: utf-8
module CartoDB
  module Visualization
    class TableBlender
      def initialize(user, tables=[])
        @user   = user
        @tables = tables
      end #initialize

      def blend
        maps            = tables.map(&:map)
        copier          = CartoDB::Map::Copier.new
        destination_map = copier.new_map_from(maps.first).save

        maps.each { |map| copier.copy_data_layers(map, destination_map) }
        destination_map
      end #blend

      def blended_privacy
        return 'private' if tables.map(&:privacy_text).include?('PRIVATE')
        return 'public'
      end #blended_privacy

      private

      attr_reader :tables, :user
    end # TableBlender
  end # Visualization
end # CartoDB

