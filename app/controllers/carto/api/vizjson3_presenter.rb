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
        return layer_data unless layer_data[:type] == 'torque'
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
