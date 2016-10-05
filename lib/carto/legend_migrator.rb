# encoding utf-8

module Carto
  class LegendMigrator
    attr_reader :layer_id, :legend

    def initialize(layer_id, legend)
      @layer_id = layer_id
      @legend = legend
    end

    def migrate
      new_type, new_definition = type_and_definition
      title = title if title.present? && show_title

      Legend.new(layer_id: layer_id,
                 title: title,
                 type: new_type,
                 definition: new_definition)
    end

    private

    def type
      @type ||= legend['type']
    end

    def items
      @items ||= legend['items']
    end

    def title
      @title ||= legend['title']
    end

    def show_title
      @show_title ||= legend['show_title']
    end

    HTML_TYPES = %w(choropleth intensity density).freeze
    CUSTOM_TYPES = %w(category custom).freeze

    def type_and_definition
      if HTML_TYPES.include?(type)
        ['html', build_html_definition_from_ramp_type]
      elsif CUSTOM_TYPES.include?(type)
        ['custom', build_custom_definition_from_custom_type]
      elsif type == 'bubble'
        ['bubble', build_bubble_definition_from_bubble]
      else
        [nil, nil]
      end
    end

    COLOR_REGEXP = /^#(?:[0-9a-fA-F]{3}){1,2}$/

    def build_custom_definition_from_custom_type
      custom_definition = Hash.new

      categories = items.each_with_index.map do |item, index|
        title = item['name'].to_s || "Category #{index + 1}"
        color = item['value']

        category_definition = { title: title }

        if color && color =~ COLOR_REGEXP
          category_definition[:color] = color
        end

        category_definition
      end

      custom_definition[:categories] = categories
      custom_definition
    end

    def build_bubble_definition_from_bubble
      { color: items.last['value'] }
    end

    def build_html_definition_from_ramp_type
      left_label, right_label = labels_for_items
      style = style_for_gradient

      html =  %(<div class="CDB-Legend-item" style="">\n)
      html += %(  <div class="u-flex u-justifySpace u-bSpace--m">\n)
      html += %(    <p class="CDB-Text CDB-Size-small">#{left_label}</p>\n)
      html += %(    <p class="CDB-Text CDB-Size-small">#{right_label}</p>\n)
      html += %(  </div>\n)
      html += %(  <div class="Legend-choropleth" style="#{style}"></div>\n)
      html += %(</div>\n)

      { html: html }
    end

    def style_for_gradient
      first_color_index = labels_for_items.compact.count
      item_colors = items[first_color_index..-1].map do |item|
        color = item['value'].downcase

        color if color =~ COLOR_REGEXP
      end

      gradient_stops = item_colors.compact.join(', ')
      "background: linear-gradient(90deg , #{gradient_stops})"
    end

    def labels_for_items
      return @labels_for_items if @labels_for_items

      first_item = items.first
      second_item = items.second

      if first_item && first_item['type'] == 'text'
        left_label = first_item['value']
      end

      if second_item && second_item['type'] == 'text'
        right_label = second_item['value']
      end

      @labels_for_items = [left_label, right_label]
      @labels_for_items
    end
  end
end
