# encoding: utf-8
require_relative '../map'

module CartoDB
  module Map
    class Copier
      def initialize(map, user)
        @map  = map
        @user = user
      end #initialize

      def copy
        attributes  = map.to_hash.select { |k, v| k != :id }
        new_map     = ::Map.new(attributes).save
        copy_layers(user, map, new_map)

        new_map
      end #copy

      private

      attr_reader :map, :user

      def copy_layers(user, map, new_map)
        layer_copies_from(map).map { |layer| link(user, new_map, layer) }
      end #copy_layers

      def layer_copies_from(map)
        map.layers.each { |layer| layer.copy }
      end #new_layers

      def link(user, map, layer)
        layer.maps.push(map)
        layer.users.push(user)
        layer.save
      end #link
    end # Copier
  end # Map
end # CartoDB

