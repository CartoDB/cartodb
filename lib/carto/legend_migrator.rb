# encoding utf-8

module Carto
  class LegendMigrator
    attr_reader :layer_id, :legend

    def initialize(layer_id, legend)
      @layer_id = layer_id
      @legend = legend
    end

    def new_legend
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

    def type_and_definition
      if type == 'custom'
        ['custom', build_custom_definition_from_category]
      elsif type == 'choropleth'
        ['html', build_html_definition_from_choropleth]
      elsif type == 'bubble'
        ['bubble', build_bubble_definition_from_bubble]
      else
        [nil, nil]
      end
    end

    def build_custom_definition_from_category
      custom_definition = Hash.new

      categories = items.each_with_index.map do |item, index|
        title = item['name'] || "Category #{index + 1}"
        color = item['value']

        category_definition = { title: title }
        category_definition[:color] = color if color

        category_definition
      end

      custom_definition[:categories] = categories
      custom_definition
    end

    def build_bubble_definition_from_bubble
      { color: items.last['value'] }
    end

    def build_html_definition_from_choropleth
      left_label = items.first['value']
      right_label = items.second['value']

      item_colors = items[2..-1].map do |item|
        color = item['value'].downcase

        color if color =~ /^#(?:[0-9a-fA-F]{3}){1,2}$/
      end

      gradient_stops = item_colors.compact.join(', ')
      style = "background: linear-gradient(90deg , #{gradient_stops})"

      html =  %(<div class="CDB-Legend-item" style="">\n)
      html += %(  <div class="u-flex u-justifySpace u-bSpace--m">\n)
      html += %(    <p class="CDB-Text CDB-Size-small">#{left_label}</p>\n)
      html += %(    <p class="CDB-Text CDB-Size-small">#{right_label}</p>\n)
      html += %(  </div>\n)
      html += %(  <div class="Legend-choropleth" style="#{style}"></div>\n)
      html += %(</div>\n)

      { html: html }
    end
  end
end
