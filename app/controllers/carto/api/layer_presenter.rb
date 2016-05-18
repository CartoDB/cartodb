# encoding: UTF-8

module Carto
  module Api
    class LayerPresenter

      PUBLIC_VALUES = %W{ options kind infowindow tooltip id order }

      # CSS is not stored by default, only when sent by frontend,
      # so this is returned whenever a layer that needs CSS but has none is requestesd
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

      def initialize(layer, options={}, configuration={}, decoration_data={})
        @layer            = layer
        @options          = options
        @configuration    = configuration
        @decoration_data  = decoration_data

        @viewer_user = options.fetch(:viewer_user, nil)
        @owner_user  = options.fetch(:user, nil)
      end

      def to_poro
        base_poro(@layer)
      end

      def to_json
        public_values(@layer).to_json
      end

      def to_vizjson_v2
        if base?(@layer)
          with_kind_as_type(base_poro(@layer)).symbolize_keys
        elsif torque?(@layer)
          as_torque
        else
          {
            id:         @layer.id,
            type:       'CartoDB',
            infowindow: infowindow_data_v2,
            tooltip:    tooltip_data_v2,
            legend:     @layer.legend,
            order:      @layer.order,
            visible:    public_values(@layer).symbolize_keys[:options]['visible'],
            options:    options_data_v2
          }
        end
      end

      def to_vizjson_v1
        return base_poro(@layer).symbolize_keys if base?(@layer)
        {
          id:         @layer.id,
          kind:       'CartoDB',
          infowindow: infowindow_data_v1,
          order:      @layer.order,
          options:    options_data_v1
        }
      end

      private

      def viewer_is_owner?
        return (@owner_user.id == @viewer_user.id) if (@owner_user && @viewer_user)

        # This can be removed if 'user_name' support is dropped
        layer_opts = @layer.options.nil? ? Hash.new : @layer.options
        if @viewer_user && layer_opts['user_name'] && layer_opts['table_name']
          @viewer_user.username == layer_opts['user_name']
        else
          true
        end
      end

      # INFO: Assumes table_name needs to always be qualified, don't call if doesn't
      def qualify_table_name
        layer_opts = @layer.options.nil? ? Hash.new : @layer.options

        # if the table_name already have a schema don't add another one.
        # This case happens when you share a layer already shared with you
        return layer_opts['table_name'] if layer_opts['table_name'].include?('.')

        if @owner_user && @viewer_user
          @layer.qualified_table_name(@owner_user)
        else
          # TODO: Legacy support: Remove 'user_name' and use always :viewer_user and :user
          user_name = layer_opts['user_name']
          if user_name.include?('-')
            "\"#{layer_opts['user_name']}\".#{layer_opts['table_name']}"
          else
            "#{layer_opts['user_name']}.#{layer_opts['table_name']}"
          end
        end
      end

      def base_poro(layer)
        # .merge left for backwards compatibility
        public_values(layer).merge('options' => layer_options)
      end

      def public_values(layer)
        Hash[ PUBLIC_VALUES.map { |attribute| [attribute, layer.send(attribute)] } ]
      end

      # Decorates the layer presentation with data if needed. nils on the decoration act as removing the field
      def decorate_with_data(source_hash, decoration_data)
        decoration_data.each { |key, value|
          source_hash[key] = value
          source_hash.delete_if { |k, v|
            v.nil?
          }
        }
        source_hash
      end

      def base?(layer)
        ['tiled', 'background', 'gmapsbase', 'wms'].include? layer.kind
      end

      def torque?(layer)
        layer.kind == 'torque'
      end

      def with_template(infowindow, path)
        # Careful with this logic:
        # - nil means absolutely no infowindow (e.g. a torque)
        # - path = nil or template filled: either pre-filled or custom infowindow, nothing to do here
        # - template and path not nil but template not filled: stay and fill
        return nil if infowindow.nil?

        template = infowindow['template']
        return infowindow if (!template.nil? && !template.empty?) || path.nil?

        infowindow.merge!(template: File.read(path))
        infowindow
      end

      def layer_options
        layer_opts = @layer.options.nil? ? Hash.new : @layer.options
        if layer_opts['table_name'] && !viewer_is_owner?
          layer_opts['table_name'] = qualify_table_name
        end

        if layer_opts['style_properties'].nil? || layer_opts['style_properties']['autogenerated'] == true
          layer_opts['style_properties'] = StylePropertiesGenerator.new(@layer.options['wizard_properties']).generate
        end

        layer_opts
      end

      def options_data_v1
        return @layer.options if @options[:full]
        @layer.options.select { |key, value| public_options.include?(key.to_s) }
      end

      def options_data_v2
        if @options[:full]
          decorate_with_data(@layer.options, @decoration_data)
        else
          sql = sql_from(@layer.options)
          data = {
            sql:                wrap(sql, @layer.options),
            layer_name:         name_for(@layer),
            cartocss:           css_from(@layer.options),
            cartocss_version:   @layer.options.fetch('style_version'),  # Mandatory
            interactivity:      @layer.options.fetch('interactivity')   # Mandatory
          }
          data = decorate_with_data(data, @decoration_data)

          if @viewer_user
            if @layer.options['table_name'] && !viewer_is_owner?
              data['table_name'] = qualify_table_name
            end
          end
          data
        end
      end

      def with_kind_as_type(attributes)
        decorate_with_data(attributes.merge(type: attributes.delete('kind')), @decoration_data)
      end

      def as_torque
        api_templates_type = @options.fetch(:https_request, false) ? 'private' : 'public'
        layer_options = decorate_with_data(
            # Make torque always have a SQL query too (as vizjson v2)
            @layer.options.merge({ 'query' => wrap(sql_from(@layer.options), @layer.options) }),
            @decoration_data
          )

        {
          id:         @layer.id,
          type:       'torque',
          order:      @layer.order,
          legend:     @layer.legend,
          options:    {
            stat_tag:           @options.fetch(:visualization_id),
            maps_api_template:  ApplicationHelper.maps_api_template(api_templates_type),
            sql_api_template:   ApplicationHelper.sql_api_template(api_templates_type),
            # tiler_* is kept for backwards compatibility
            tiler_protocol:     (@configuration[:tiler]["public"]["protocol"] rescue nil),
            tiler_domain:       (@configuration[:tiler]["public"]["domain"] rescue nil),
            tiler_port:         (@configuration[:tiler]["public"]["port"] rescue nil),
            # sql_api_* is kept for backwards compatibility
            sql_api_protocol:   (@configuration[:sql_api]["public"]["protocol"] rescue nil),
            sql_api_domain:     (@configuration[:sql_api]["public"]["domain"] rescue nil),
            sql_api_endpoint:   (@configuration[:sql_api]["public"]["endpoint"] rescue nil),
            sql_api_port:       (@configuration[:sql_api]["public"]["port"] rescue nil),
            layer_name:         name_for(@layer),
          }.merge(
            layer_options.select { |k| TORQUE_ATTRS.include? k })
        }
      end

      def infowindow_data_v1
        with_template(@layer.infowindow, @layer.infowindow_template_path)
      rescue => e
        Rollbar.report_exception(e)
        throw e
      end

      def infowindow_data_v2
        whitelisted_infowindow(with_template(@layer.infowindow, @layer.infowindow_template_path))
      rescue => e
        Rollbar.report_exception(e)
        throw e
      end

      def tooltip_data_v2
        whitelisted_infowindow(with_template(@layer.tooltip, @layer.tooltip_template_path))
      rescue => e
        Rollbar.report_exception(e)
        throw e
      end

      def name_for(layer)
        layer_alias = layer.options.fetch('table_name_alias', nil)
        table_name  = layer.options['table_name']

        return table_name unless layer_alias && !layer_alias.empty?
        layer_alias
      end

      def sql_from(options)
        query = options.fetch('query', '')
        return default_query_for(options) if query.nil? || query.empty?
        query
      end

      def css_from(options)
        style = options.include?('tile_style') ? options['tile_style'] : nil
        (style.nil? || style.strip.empty?) ? EMPTY_CSS : style
      end

      def wrap(query, options)
        wrapper = options.fetch('query_wrapper', nil)
        return query if wrapper.nil? || wrapper.empty?
        EJS.evaluate(wrapper, sql: query)
      end

      def default_query_for(layer_options)
        if viewer_is_owner?
          "select * from #{layer_options['table_name']}"
        else
          "select * from #{qualify_table_name}"
        end
      end

      def public_options
        return @configuration if @configuration.empty?
        @configuration.fetch(:layer_opts).fetch('public_opts')
      end

      def whitelisted_infowindow(infowindow)
        infowindow.nil? ? nil : infowindow.select { |key, value|
                                                    INFOWINDOW_KEYS.include?(key) || INFOWINDOW_KEYS.include?(key.to_s)
                                                  }
      end
    end

    class StylePropertiesGenerator
      def initialize(wizard_properties)
        @wizard_properties = wizard_properties
        @source_type = @wizard_properties.present? ? @wizard_properties['type'] : nil
      end

      def generate
        return nil unless @wizard_properties.present?

        type = STYLE_PROPERTIES_TYPE[@source_type]
        return nil unless type

        {
          'autogenerated' => true,
          'type' => type,
          'properties' => wizard_properties_properties_to_style_properties_properties(@wizard_properties['properties'])
        }
      end

      private

      STYLE_PROPERTIES_TYPE = {
        'polygon' => 'simple',
        'bubble' => 'simple',
        'choropleth' => 'simple',
        'category' => 'simple',
        'torque' => 'simple',
        'torque_cat' => 'simple',
        'torque_heat' => 'simple'
      }.freeze

      def set_if_present(hash, key, value)
        hash[key] = value if value.present?
      end

      def apply_direct_mapping(hash, original_hash, mapping)
        mapping.each do |source, target|
          set_if_present(hash, target, original_hash[source])
        end
      end

      def apply_default_opacity(hash)
        if hash['fixed'] && !hash['opacity']
          hash['opacity'] = 1
        end
      end

      PROPERTIES_DIRECT_MAPPING = {
        "marker-comp-op" => "blending"
      }.freeze

      def wizard_properties_properties_to_style_properties_properties(wizard_properties_properties)
        spp = {}
        wpp = wizard_properties_properties
        return spp unless wpp

        apply_direct_mapping(spp, wpp, PROPERTIES_DIRECT_MAPPING)

        set_if_present(spp, 'fill', generate_fill(wpp))

        set_if_present(spp, 'labels', generate_labels(wpp))

        spp
      end

      def generate_fill(wpp)
        fill = {}

        set_if_present(fill, 'color', generate_color(wpp))

        fill
      end

      COLOR_DIRECT_MAPPING = {
        'property' => 'attribute',
        'qfunction' => 'quantification'
      }.freeze

      def generate_color(wpp)
        color = {}

        %w(polygon marker).each do |prefix|
          set_if_present(color, 'fixed', wpp["#{prefix}-fill"])

          unless color['opacity']
            set_if_present(color, 'opacity', wpp["#{prefix}-opacity"])
          end

          apply_default_opacity(color)
        end

        radius_min = wpp['radius_min']
        radius_max = wpp['radius_max']
        if radius_min && radius_max
          color['range'] = [radius_min, radius_max]
        end

        apply_direct_mapping(color, wpp, COLOR_DIRECT_MAPPING)

        if @source_type == 'bubble'
          color['bins'] = 10
        end

        if @source_type == 'choropleth'
          color['range'] = colorbrewer_ramp_array_from_color_ramp(wpp['color_ramp'])
          color['bins'] = extract_bins_from_method(wpp['method']).to_i
        end

        color
      end

      # Taken from `lib/assets/javascripts/cartodb/models/color_ramps.js`
      COLOR_ARRAYS_FROM_RAMPS = {
        'pink' => "['#E7E1EF', '#C994C7', '#DD1C77']",
        'red' => "['#FFEDA0', '#FEB24C', '#F03B20']",
        'black' => "['#F0F0F0', '#BDBDBD', '#636363']",
        'green' => "['#E5F5F9', '#99D8C9', '#2CA25F']",
        'blue' => "['#EDF8B1', '#7FCDBB', '#2C7FB8']",
        'inverted_pink' => "['#DD1C77','#C994C7','#E7E1EF']",
        'inverted_red' => "['#F03B20','#FEB24C','#FFEDA0']",
        'inverted_black' => "['#636363','#BDBDBD','#F0F0F0']",
        'inverted_green' => "['#2CA25F','#99D8C9','#E5F5F9']",
        'inverted_blue' => "['#2C7FB8','#7FCDBB','#EDF8B1']",
        'spectrum1' => "['#1a9850', '#fff2cc', '#d73027']",
        'spectrum2' => "['#0080ff', '#fff2cc', '#ff4d4d']",
        'blue_states' => "['#ECF0F6', '#6182B5', '#43618F']",
        'purple_states' => "['#F1E6F1', '#B379B3', '#8A4E8A']",
        'red_states' => "['#F2D2D3', '#D4686C', '#C1373C']",
        'inverted_blue_states' => "['#43618F', '#6182B5', '#ECF0F6']",
        'inverted_purple_states' => "['#8A4E8A', '#B379B3', '#F1E6F1']",
        'inverted_red_states' => "['#C1373C', '#D4686C', '#F2D2D3']"
      }.freeze

      def colorbrewer_ramp_array_from_color_ramp(ramp)
        return [] unless ramp

        COLOR_ARRAYS_FROM_RAMPS[ramp]
      end

      DEFAULT_BINS = 6

      def extract_bins_from_method(method)
        return DEFAULT_BINS unless method

        number_match = method.match(/(\d*) Buckets/i)
        number_match && number_match[1] ? number_match[1] : DEFAULT_BINS
      end

      TEXT_DIRECT_MAPPING = {
        'text-name' => 'attribute',
        'text-face-name' => 'font',
        'text-dy' => 'offset',
        'text-allow-overlap' => 'overlap',
        'text-placement-type' => 'placement'
      }.freeze

      def generate_labels(wpp)
        labels = {}

        apply_direct_mapping(labels, wpp, TEXT_DIRECT_MAPPING)
        labels['attribute'] = nil if labels['attribute'] == 'None'

        set_if_present(labels, 'fill', generate_labels_fill(wpp))
        set_if_present(labels, 'halo', generate_labels_halo(wpp))

        labels['enabled'] = true if labels.present?

        labels
      end

      def generate_labels_fill(wpp)
        labels_fill = {}

        set_if_present(labels_fill, 'size', generate_labels_fill_size(wpp))
        set_if_present(labels_fill, 'color', generate_labels_fill_color(wpp))

        labels_fill
      end

      TEXT_SIZE_DIRECT_MAPPING = {
        'text-size' => 'fixed'
      }.freeze

      TEXT_COLOR_DIRECT_MAPPING = {
        'text-fill' => 'fixed',
        'text-opacity' => 'opacity'
      }.freeze

      def generate_labels_fill_size(wpp)
        size = {}

        apply_direct_mapping(size, wpp, TEXT_SIZE_DIRECT_MAPPING)

        size
      end

      def generate_labels_fill_color(wpp)
        color = {}

        apply_direct_mapping(color, wpp, TEXT_COLOR_DIRECT_MAPPING)
        apply_default_opacity(color)

        color
      end

      def generate_labels_halo(wpp)
        labels_halo = {}

        set_if_present(labels_halo, 'size', generate_labels_halo_size(wpp))
        set_if_present(labels_halo, 'color', generate_labels_halo_color(wpp))

        labels_halo
      end

      HALO_SIZE_DIRECT_MAPPING = {
        'text-halo-radius' => 'fixed'
      }.freeze

      HALO_COLOR_DIRECT_MAPPING = {
        'text-halo-fill' => 'fixed',
        'text-halo-opacity' => 'opacity'
      }.freeze

      def generate_labels_halo_size(wpp)
        size = {}

        apply_direct_mapping(size, wpp, HALO_SIZE_DIRECT_MAPPING)

        size
      end

      def generate_labels_halo_color(wpp)
        color = {}

        apply_direct_mapping(color, wpp, HALO_COLOR_DIRECT_MAPPING)
        apply_default_opacity(color)

        color
      end
    end
  end
end
