# encoding: UTF-8

module Carto
  module Api
    class LayerPresenter

      PUBLIC_VALUES = [:options, :kind, :infowindow, :tooltip, :id, :order, :parent_id]

      def initialize(layer, current_viewer, options = {})
        @layer = layer
        @current_viewer = current_viewer
        @options = options
      end

      def to_poro
         public_values(@layer).merge(children_for(@layer))
      end

      private

      def public_values(layer)
        Hash[ PUBLIC_VALUES.map { |attribute| [attribute, layer.send(attribute)] } ]
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

    end
  end
end
