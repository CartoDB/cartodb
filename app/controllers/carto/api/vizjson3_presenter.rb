require_dependency 'carto/api/layer_vizjson_adapter'

module Carto
  module Api
    class VizJSON3Presenter
      # Forwarding as a development transient tool
      extend Forwardable

      delegate [:layer_group_for, :named_map_layer_group_for, :other_layers_for,
        :visualization, :map, :layers_for, :configuration,
        :clean_description, :bounds_from, :all_layers_for,
        :layers_for, :layer_group_for_named_map, :basemap_layer_for,
        :non_basemap_base_layers_for, :overlays_for, :children_for,
        :ordered_overlays_for, :default_options, :auth_tokens_for] => :@old_vizjson

      def create_old_vizjson(source_options = {})
        options = {
          full: false,
          user_name: user.username,
          user_api_key: user.api_key,
          user: user,
          viewer_user: user
        }.merge(source_options)

        CartoDB::Visualization::VizJSON.new(Carto::Api::VisualizationVizJSONAdapter.new(@visualization, @redis_cache), options, Cartodb.config)
      end

      def initialize(visualization, redis_cache = $tables_metadata, redis_vizjson_cache = CartoDB::Visualization::RedisVizjsonCache.new(redis_cache, 3))
        @visualization = visualization
        @redis_cache = redis_cache
        @redis_vizjson_cache = redis_vizjson_cache
      end

      def to_vizjson(vector: false, **options)
        vizjson = @redis_vizjson_cache.cached(@visualization.id, options.fetch(:https_request, false)) do
          calculate_vizjson(options)
        end

        vizjson[:widgets] = Carto::Widget.from_visualization_id(@visualization.id).map do |w|
          Carto::Api::WidgetPresenter.new(w).to_poro
        end

        vizjson[:layers].each { |l| layer_vizjson2_to_3(l) }

        vizjson[:datasource] = datasource(options)
        vizjson[:user] = user_vizjson_info
        vizjson[:vector] = vector

        vizjson
      end

      private

      VIZJSON_VERSION = '3.0.0'.freeze

      def calculate_vizjson(options = {})
        # Used by forwards
        @old_vizjson = create_old_vizjson(options)

        poro_data = {
          id:             visualization.id,
          version:        VIZJSON_VERSION,
          title:          visualization.qualified_name(@user),
          likes:          visualization.likes.count,
          description:    visualization.description_html_safe,
          scrollwheel:    map.scrollwheel,
          legends:        map.legends,
          url:            options.delete(:url),
          map_provider:   map.provider,
          bounds:         bounds_from(map),
          center:         map.center,
          zoom:           map.zoom,
          updated_at:     map.viz_updated_at,
          layers:         layers_for(visualization),
          overlays:       overlays_for(visualization),
          prev:           visualization.prev_id,
          next:           visualization.next_id,
          transition_options: visualization.transition_options
        }

        auth_tokens = auth_tokens_for(visualization)
        poro_data.merge!(auth_tokens: auth_tokens) if auth_tokens.length > 0

        children = children_for(visualization)
        poro_data.merge!(slides: children) if children.length > 0
        unless visualization.parent_id.nil?
          poro_data[:title] = visualization.parent.qualified_name(@user)
          poro_data[:description] = visualization.parent.description_html_safe
        end

        poro_data
      end

      def user
        @user ||= @visualization.user
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

      def user_vizjson_info
        {
          fullname: user.name.present? ? user.name : user.username,
          avatar_url: user.avatar_url
        }
      end

      # TODO: remove next methods patch v2 vizjson #####################################

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
          if infowindow
            infowindow_sym = infowindow.deep_symbolize_keys
            infowindow[:template] = v3_infowindow_template(infowindow_sym[:template_name], infowindow_sym[:template])
          end

          tooltip = layer_definition[:tooltip]
          if tooltip
            tooltip_sym = tooltip.deep_symbolize_keys
            tooltip[:template] = v3_tooltip_template(tooltip_sym[:template_name], tooltip_sym[:template])
          end
        end
      end

      # TODO: refactor, ugly as hell. Technical debt: #6953
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

      def v3_infowindow_template(template_name, fallback_template)
        template_name = Carto::Api::LayerVizJSONAdapter::TEMPLATES_MAP.fetch(template_name, template_name)
        if template_name.present?
          path = Rails.root.join("lib/assets/javascripts/cartodb3/mustache-templates/infowindows/#{template_name}.jst.mustache")
          File.read(path)
        else
          fallback_template
        end
      end

      def v3_tooltip_template(template_name, fallback_template)
        template_name = Carto::Api::LayerVizJSONAdapter::TEMPLATES_MAP.fetch(template_name, template_name)
        if template_name.present?
          path = Rails.root.join("lib/assets/javascripts/cartodb3/mustache-templates/tooltips/#{template_name}.jst.mustache")
          File.read(path)
        else
          fallback_template
        end
      end

      def torque_layer_vizjson2_to_3(layer_data)
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
    end
  end
end
