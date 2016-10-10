# encoding utf-8

module Carto
  class LegendMigrator
    attr_reader :layer_id, :legend

    def initialize(layer_id, legend)
      @layer_id = layer_id
      @legend = legend
    end

    def build
      new_type, new_definition = type_and_definition
      title = title if title.present? && legend['show_title']

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
      legend['title']
    end

    HTML_RAMP_TYPES = %w(choropleth intensity density).freeze
    CUSTOM_TYPES = %w(category custom).freeze

    def type_and_definition
      if HTML_RAMP_TYPES.include?(type)
        ['html', build_html_definition_from_ramp_type]
      elsif CUSTOM_TYPES.include?(type)
        ['custom', build_custom_definition_from_custom_type]
      elsif type == 'bubble'
        ['html', build_html_definition_from_bubble]
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

    def build_html_definition_from_ramp_type
      left_label, right_label = labels_for_items
      style = style_for_gradient

      html =  %(<div class="u-flex u-justifySpace u-bSpace--m">\n)
      html += %(  <p class="CDB-Text CDB-Size-small">#{left_label}</p>\n)
      html += %(  <p class="CDB-Text CDB-Size-small">#{right_label}</p>\n)
      html += %(</div>\n)
      html += %(<div class="Legend-choropleth" style="#{style}"></div>\n)

      { html: html }
    end

    def style_for_gradient
      first_color_index = labels_for_items.compact.count
      item_colors = items[first_color_index..-1].map do |item|
        color = item['value'].downcase

        color if color =~ COLOR_REGEXP
      end

      if item_colors.count == 1
        item_colors << generate_end_color(item_colors.first)
      end

      gradient_stops = item_colors.compact.join(', ')
      "background: linear-gradient(90deg, #{gradient_stops})"
    end

    def build_html_definition_from_bubble
      left, right = labels_for_items

      range = right - left
      step = range / 5

      first = formmated_string_number(left)
      second = formmated_string_number(left + (2 * step))
      third = formmated_string_number(left + (3 * step))
      fourth = formmated_string_number(left + (4 * step))
      fifth = formmated_string_number(right + step)

      average = right / 2
      avergae_percent = average * 100 / right
      average_str = formmated_string_number(right / 2)

      fifth_mark = 100
      fourth_mark = 75
      third_mark = 50
      second_mark = 25
      first_mark = 0

      color = items.last['value']

      html =  %(<div class="Bubble-container u-flex u-justifySpace">\n)
      html += %(  <ul class="Bubble-numbers u-flex u-justifySpace">\n)
      html += %(    <li class="Bubble-numbersItem CDB-Text CDB-Size-small" style="bottom: #{fifth_mark}%">#{fifth}</li></li>\n)
      html += %(    <li class="Bubble-numbersItem CDB-Text CDB-Size-small" style="bottom: #{fourth_mark}%">#{fourth}</li></li>\n)
      html += %(    <li class="Bubble-numbersItem CDB-Text CDB-Size-small" style="bottom: #{third_mark}%">#{third}</li></li>\n)
      html += %(    <li class="Bubble-numbersItem CDB-Text CDB-Size-small" style="bottom: #{second_mark}%">#{second}</li></li>\n)
      html += %(    <li class="Bubble-numbersItem CDB-Text CDB-Size-small" style="bottom: #{first_mark}%">#{first}</li></li>\n)
      html += %(  </ul>\n)
      html += %(  <div class="Bubble-inner">\n)
      html += %(    <ul class="Bubble-list">\n)
      html += %(      <li class="js-bubbleItem Bubble-item Bubble-item—-01" style="height: #{fifth_mark}%; width: #{fifth_mark}%">\n)
      html += %(        <span class="Bubble-itemCircle" style="background-color: #{color}"></span>\n)
      html += %(      </li>\n)
      html += %(      <li class="js-bubbleItem Bubble-item Bubble-item—-01" style="height: #{fourth_mark}%; width: #{fourth_mark}%">\n)
      html += %(        <span class="Bubble-itemCircle" style="background-color: #{color}"></span>\n)
      html += %(      </li>\n)
      html += %(      <li class="js-bubbleItem Bubble-item Bubble-item—-01" style="height: #{third_mark}%; width: #{third_mark}%">\n)
      html += %(        <span class="Bubble-itemCircle" style="background-color: #{color}"></span>\n)
      html += %(      </li>\n)
      html += %(      <li class="js-bubbleItem Bubble-item Bubble-item—-01" style="height: #{second_mark}%; width: #{second_mark}%">\n)
      html += %(        <span class="Bubble-itemCircle" style="background-color: #{color}"></span>\n)
      html += %(      </li>\n)
      html += %(    </ul>\n)
      html += %(    <p class="Bubble-average_strr CDB-Text CDB-Size-small u-altTextColor" style="bottom: #{avergae_percent}%">AVG: #{average_str}</p>\n)
      html += %(  </div>\n)
      html += %(</div>\n)

      { html: html }
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

    def generate_end_color(start_color, brighten_steps: 4)
      start_red, start_green, start_blue = html_color_to_rgb(start_color)

      brightened_red = start_red
      brightened_green = start_green
      brightened_blue = start_blue
      brighten_steps.times do
        brightened_red = (brightened_red * start_red / 255)
        brightened_green = (brightened_green * start_green / 255)
        brightened_blue = (brightened_blue * start_blue / 255)
      end

      hex_red = brightened_red.to_s(16)
      hex_green = brightened_green.to_s(16)
      hex_blue = brightened_blue.to_s(16)

      if hex_red.length == 1
        hex_red = [hex_red, hex_red].join
      end

      if hex_green.length == 1
        hex_green = [hex_green, hex_green].join
      end

      if hex_blue.length == 1
        hex_blue = [hex_blue, hex_blue].join
      end

      "##{hex_red}#{hex_green}#{hex_blue}"
    end

    def html_color_to_rgb(html_color)
      stripped = html_color.delete('#')

      if stripped.length == 3
        characters = stripped.map { |character| [character, character] }
        stripped = characters.flatten.join
      end

      [stripped[0..1].hex, stripped[2..3].hex, stripped[4..5].hex]
    end

    def formmated_string_number(number)
      if number < 1_000
        number.to_i.to_s
      elsif number < 1_000_000
        "#{(number / 1_000).to_i}K"
      else
        "#{(number / 1_000_000).to_i}M"
      end
    end
  end
end
