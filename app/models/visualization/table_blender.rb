# encoding: utf-8

require_dependency 'map/copier'

module CartoDB
  module Visualization
    class TableBlender
      def initialize(user, tables=[])
        @user   = user
        @tables = tables
      end

      def blend
        raise "Viewer users can't blend tables" if user.viewer

        maps            = tables.map(&:map)
        copier          = CartoDB::Map::Copier.new
        destination_map = copier.new_map_from(maps.first).save

        copier.copy_base_layer(maps.first, destination_map)

        maps.each { |map| copier.copy_data_layers(map, destination_map, user) }

        destination_map.user = user
        destination_map.save
        destination_map
      end

      def blended_privacy
        return Visualization::Member::PRIVACY_PRIVATE if tables.any?(&:private?)
        return Visualization::Member::PRIVACY_LINK if tables.any?(&:public_with_link_only?)
        Visualization::Member::PRIVACY_PUBLIC
      end

      private

      attr_reader :tables, :user
    end
  end
end
