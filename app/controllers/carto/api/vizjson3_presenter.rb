require_relative 'vizjson_presenter'

module Carto
  module Api
    class VizJSON3Presenter

      def initialize(visualization, redis_cache = $tables_metadata)
        @visualization = visualization
        @redis_cache = redis_cache
        @redis_vizjson_cache = CartoDB::Visualization::RedisVizjsonCache.new(redis_cache)
      end

      def to_vizjson(vector: false, **options)
        vizjson = symbolize_vizjson(Carto::Api::VizJSONPresenter.new(@visualization, @redis_cache).to_vizjson(options))

        vizjson[:widgets] = Carto::Widget.from_visualization_id(@visualization.id).map do |w|
          Carto::Api::WidgetPresenter.new(w).to_poro
        end

        vizjson[:layers].each { |l| layer_vizjson2_to_3(l) }

        vizjson[:datasource] = datasource(options)
        vizjson[:user] = user
        vizjson[:vector] = vector

        vizjson
      end

      private

      def symbolize_vizjson(vizjson)
        vizjson = vizjson.deep_symbolize_keys
        vizjson[:layers] = vizjson[:layers].map(&:deep_symbolize_keys)
        vizjson
      end

      def layer_vizjson2_to_3(layer_data)
        if layer_data[:type] == 'torque'
          torque_layer_vizjson2_to_3(layer_data)
        end

        layer_definitions_from_layer_data(layer_data).each do |layer_definition|
            infowindow = layer_definition[:infowindow]
            infowindow[:template] = v3_infowindow_template(infowindow[:template_name], infowindow[:template])
        end
      end

      # TODO: refactor, ugly as hell. Technical debt: #6912
      def layer_definitions_from_layer_data(layer_data)
        if layer_data[:options] &&
           layer_data[:options][:layer_definition] &&
           layer_data[:options][:layer_definition][:layers]
          layer_data[:options][:layer_definition][:layers]
        elsif layer_data[:options] &&
              layer_data[:options][:named_map] &&
              layer_data[:options][:named_map][:layers]
          layer_data[:options][:named_map][:layers]
        else
          []
        end
      end

      # TODO: refactor, maybe this can be done straight away in the LayerVizJSONAdapter. Technical debt: #6912
      def v3_infowindow_template(template_name, fallback_template)
        template_name = Carto::Api::LayerVizJSONAdapter::TEMPLATES_MAP.fetch(template_name, template_name)
        if template_name.present?
          path = Rails.root.join("lib/assets/javascripts/cartodb/table/views/infowindow/templates_v3/#{template_name}.jst.mustache")
          File.read(path)
        else
          fallback_template
        end
      end

      def torque_layer_vizjson2_to_3(layer_data)
        return layer_data unless
        layer_options = layer_data[:options]

        layer_options[:cartocss] = layer_options[:tile_style]
        layer_options.delete(:tile_style)

        layer = @visualization.layers.select { |l| l.id == layer_data[:id] }.first
        layer_options[:cartocss_version] = layer.options['style_version'] if layer
        layer_options.delete(:style_version)

        layer_options[:sql] = if layer_options[:query].present? || layer.nil?
                                layer_options[:query]
                              else
                                layer.options['query']
                              end
        layer_options.delete(:query)
      end

      def datasource(options)
        api_templates_type = options.fetch(:https_request, false) ? 'private' : 'public'
        ds = {
          user_name: @visualization.user.username,
          maps_api_template: ApplicationHelper.maps_api_template(api_templates_type),
          stat_tag: @visualization.id
        }

        ds[:template_name] = CartoDB::NamedMapsWrapper::NamedMap.template_name(@visualization.id) if @visualization.retrieve_named_map?

        ds
      end

      def user
        {
          fullname: @visualization.user.name.present? ? @visualization.user.name : @visualization.user.username,
          avatar_url: @visualization.user.avatar_url
        }
      end
    end
  end
end
