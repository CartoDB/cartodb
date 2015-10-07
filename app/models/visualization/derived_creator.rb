# encoding: utf-8

module CartoDB
  module Visualization
    class DerivedCreator
      DEFAULT_MAP_NAME = 'Untitled Map'

      def initialize(user, tables=[])
        @user   = user
        @tables = tables
      end

      def create
        blender = CartoDB::Visualization::TableBlender.new(user, tables)
        map = blender.blend
        vis = CartoDB::Visualization::Member.new(
          {
            name:     beautify_name,
            map_id:   map.id,
            type:     CartoDB::Visualization::Member::TYPE_DERIVED,
            privacy:  blender.blended_privacy,
            user_id:  user.id
          }
        )
        CartoDB::Visualization::Overlays.new(vis).create_default_overlays
        vis.store
        vis
      end

      private

      def beautify_name
        if tables.length > 1
          DEFAULT_MAP_NAME
        else
          table = tables[0]
          tables.beautify_name(table.name)
        end
      end

      attr_reader :user, :tables
    end
  end
end

