# encoding: utf-8

module CartoDB
  module NamedMapsWrapper
    class Presenter

      NAMED_MAP_TYPE = 'namedmap'
      LAYER_TYPES_TO_DECORATE = [ 'torque' ]
      DEFAULT_TILER_FILTER = 'mapnik'

      # @throws NamedMapsPresenterError
      def initialize(visualization, layergroup, options, configuration)
        @visualization    = visualization
        @options          = options
        @configuration    = configuration
        @layergroup_data  = layergroup
        @named_map_name   = Carto::NamedMaps::Template.new(Carto::Visualization.find(@visualization.id)).name
      end

      # Prepares additional data to decorate layers in the LAYER_TYPES_TO_DECORATE list
      # - Parameters set inside as nil will remove the field itself from the layer data
      # @throws NamedMapsPresenterError
      def get_decoration_for_layer(layer_type, layer_index)
        return {} unless LAYER_TYPES_TO_DECORATE.include? layer_type

        {
          'named_map' =>  {
            'name' =>         @named_map_name,
            'layer_index' =>  layer_index,
            'params' =>       placeholders_data
          },
          'query' => nil  #do not expose SQL query on Torque layers with named maps
        }
      end

      # Prepare a PORO (Hash object) for easy JSONification
      # @see https://github.com/CartoDB/carto.js/blob/privacy-maps/doc/vizjson_format.md
      # @throws NamedMapsPresenterError
      def to_poro
        if @visualization.layers(:cartodb).size == 0
          # When there are no layers don't return named map data
          nil
        else
          api_templates_type = @options.fetch(:https_request, false) ? 'private' : 'public'
          privacy_type = @visualization.password_protected? ? 'private': api_templates_type
          {
            type:     NAMED_MAP_TYPE,
            order:    1,
            options:  {
              type:             NAMED_MAP_TYPE,
              user_name:        @options.fetch(:user_name),
              maps_api_template: ApplicationHelper.maps_api_template(privacy_type),
              sql_api_template: ApplicationHelper.sql_api_template(privacy_type),
              # tiler_* and sql_api_* are kept for backwards compatibility
              tiler_protocol:   @visualization.password_protected? ?
                                  @configuration[:tiler]['private']['protocol'] :
                                  @configuration[:tiler]['public']['protocol'],
              tiler_domain:     @visualization.password_protected? ?
                                  @configuration[:tiler]['private']['domain'] :
                                  @configuration[:tiler]['public']['domain'],
              tiler_port:       @visualization.password_protected? ?
                                  @configuration[:tiler]['private']['port'] :
                                  @configuration[:tiler]['public']['port'],
              filter:           @configuration[:tiler].fetch('filter', DEFAULT_TILER_FILTER),
              named_map:        {
                name:     @named_map_name,
                stat_tag: @visualization.id,
                params:   placeholders_data,
                layers:   configure_layers_data
              },
              attribution: @visualization.attributions_from_derived_visualizations.join(', ')
            }
          }
        end
      end

      private

      def placeholders_data
        data = {}
        @layergroup_data.each { |layer|
          data["layer#{layer[:index].to_s}".to_sym] = layer[:visible] ? 1: 0
        }
        data
      end

      # Extract relevant information from layers
      def configure_layers_data
        # Http/base layers don't appear at viz.json
        layers = @visualization.layers(:cartodb)
        layers_data = Array.new
        layers.each { |layer|
          layer_vizjson = layer.get_presenter(@options, @configuration).to_vizjson_v2
          layers_data.push(data_for_carto_layer(layer_vizjson))
        }
        layers_data
      end

      def data_for_carto_layer(layer_vizjson)
        # TODO: this id will probably be removed from named maps
        data = {
          id: layer_vizjson[:id],
          layer_name: layer_vizjson[:options][:layer_name],
          interactivity: layer_vizjson[:options][:interactivity],
          visible: layer_vizjson[:visible]
        }

        vizjson_infowindow = layer_vizjson[:infowindow]
        vizjson_infowindow_fields = vizjson_infowindow['fields'] if vizjson_infowindow

        if vizjson_infowindow.present? && vizjson_infowindow_fields && !vizjson_infowindow_fields.empty?
          data[:infowindow] = vizjson_infowindow
        end

        vizjson_tooltip = layer_vizjson[:tooltip]
        vizjson_tooltip_fields = vizjson_tooltip['fields'] if vizjson_tooltip

        if vizjson_tooltip.present? && vizjson_tooltip_fields && !vizjson_tooltip_fields.empty?
          data[:tooltip] = vizjson_tooltip
        end

        vizjson_legend = layer_vizjson[:legend]
        data[:legend] = vizjson_legend if vizjson_legend.present? && vizjson_legend.fetch('type') != 'none'

        data
      end
    end
  end
end
