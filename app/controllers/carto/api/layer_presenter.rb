# encoding: UTF-8

module Carto
  module Api
    class LayerPresenter

      PUBLIC_VALUES = [:kind, :infowindow, :tooltip, :id, :order, :parent_id]

      EMPTY_CSS = '#dummy{}'

      TORQUE_ATTRS = %w(
        table_name
        user_name
        property
        blendmode
        resolution
        countby
        torque-duration
        torque-steps
        torque-blend-mode
        query
        tile_style
        named_map
        visible
      )

      INFOWINDOW_KEYS = %w(
        fields template_name template alternative_names width maxHeight
      )

      #TODO: options part needs to be refactored
      #TODO: Many private methods need also refactoring

      # current_viewer was before an option, now is forced to be always present
      def initialize(layer, current_viewer, options={}, owner_user = nil, configuration={}, decoration_data={})
        @layer            = layer
        @current_viewer   = current_viewer
        @owner_user       = owner_user
        @options          = options
        @configuration    = configuration
        @decoration_data  = decoration_data
      end

      def to_poro
         poro = public_values(layer).merge(children_for(layer))
         if options[:viewer_user] and poro[:options] and poro[:options]['table_name']
          # if the table_name already have a schema don't add another one
          # this case happens when you share a layer already shared with you
          if poro[:options]['user_name'] != options[:viewer_user].username and not poro[:options]['table_name'].include?('.')
            user_name = poro[:options]['user_name']
            if user_name.include?('-')
              table_name = "\"#{poro[:options]['user_name']}\".#{poro[:options]['table_name']}"
            else
              table_name = "#{poro[:options]['user_name']}.#{poro[:options]['table_name']}"
            end
            poro[:options]['table_name'] = table_name
          end
        end
        poro
      end

      def to_json
         public_values(layer).merge(children_for(layer)).to_json
      end

      # TODO: Pending refactor, right now just copied
      def to_vizjson_v2
        if base?(layer)
          with_kind_as_type(public_values(layer).merge(children_for(layer)))
        elsif torque?(layer)
          as_torque
        else
          {
            id:         layer.id,
            parent_id:  layer.parent_id,
            children:   children_for(layer, false),
            type:       'CartoDB',
            infowindow: infowindow_data_v2,
            tooltip:    tooltip_data_v2,
            legend:     layer.legend,
            order:      layer.order,
            visible:    public_values(layer)[:options]['visible'],
            options:    options_data_v2
          }
        end
      end

      # TODO: Pending refactor, right now just copied
      def to_vizjson_v1
        return public_values(layer).merge(children_for(layer)) if base?(layer)
        {
          id:         layer.id,
          parent_id:  layer.parent_id,
          children:   children_for(layer, false),
          kind:       'CartoDB',
          infowindow: infowindow_data_v1,
          order:      layer.order,
          options:    options_data_v1
        }
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
        if @owner_user && @current_viewer && @owner_user.id != @current_viewer.id
          layer_options['table_name'] = @layer.qualified_table_name(@owner_user)
        end
        layer_options
      end

    end
  end
end
