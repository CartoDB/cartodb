# encoding: utf-8
module CartoDB
  module Visualization
    class TableBlender
      def initialize(user, tables=[])
        @user   = user
        @tables = tables
      end #initialize

      def blend
        origin_map  = tables.shift.map
        copier      = CartoDB::Map::Copier.new(origin_map)
        new_map     = copier.copy

        tables.each { |table| copier.copy_data_layers(table.map, new_map) }
        new_map
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

