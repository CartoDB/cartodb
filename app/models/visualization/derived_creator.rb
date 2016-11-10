# encoding: utf-8

module CartoDB
  module Visualization
    class DerivedCreator
      DEFAULT_MAP_NAME = 'Untitled Map'

      def initialize(user, tables = [])
        @rejected_layers = []

        if tables.length > user.max_layers
          tables.pop(tables.length - user.max_layers).each do |rejected_layers|
            @rejected_layers << rejected_layers.name
          end
        end

        @user   = user
        @tables = tables
      end

      def create
        blender = CartoDB::Visualization::TableBlender.new(user, tables)
        map = blender.blend

        vis = CartoDB::Visualization::Member.new(
          name: beautify_name,
          map_id: map.id,
          type: CartoDB::Visualization::Member::TYPE_DERIVED,
          privacy: blender.blended_privacy,
          user_id: user.id
        )
        unless user.private_maps_enabled
          vis.privacy = CartoDB::Visualization::Member::PRIVACY_PUBLIC
        end

        CartoDB::Visualization::Overlays.new(vis).create_default_overlays
        vis.store

        [vis, @rejected_layers]
      end

      private

      def beautify_name
        if tables.length > 1
          table = tables[0]
          table.beautify_name(table.name)
        else
          DEFAULT_MAP_NAME
        end
      end

      attr_reader :user, :tables, :rejected_layers
    end
  end
end
