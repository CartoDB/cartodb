# encoding: UTF-8

module Carto
  module Api
    class LayerPresenter

      PUBLIC_VALUES = [:kind, :infowindow, :tooltip, :id, :order, :parent_id]

      def initialize(layer, current_viewer, owner_user = nil)
        @layer = layer
        @current_viewer = current_viewer
        @owner_user = owner_user
      end

      def to_poro
         public_values(@layer).merge(children_for(@layer))
      end

      def to_json
         public_values(@layer).merge(children_for(@layer)).to_json
      end

      private

      def public_values(layer)
        Hash[ PUBLIC_VALUES.map { |attribute| [attribute, layer.send(attribute)] } ].merge(options: layer_options)
      end

      def children_for(layer, as_hash=true)
        items = layer.children.nil? ? [] : layer.children.map { |child_layer| { id: child_layer.id } }
        as_hash ? { children: items } : items
      end

      def base?(layer)
        ['tiled', 'background', 'gmapsbase', 'wms'].include? layer.kind
      end

      def torque?(layer)
        layer.kind == 'torque'
      end

      def layer_options
        layer_options = @layer.options
        if @owner_user && @owner_user.id != @current_viewer.id
          layer_options['table_name'] = @layer.qualified_table_name(@owner_user)
        end
        layer_options
      end

    end
  end
end
