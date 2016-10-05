# encoding utf-8

module Carto
  class LegendMigrator
    attr_reader :layer_id, :legend

    def initialize(layer_id, legend)
      @layer_id = layer_id
      @legend = legend
    end

    OLD_TYPES_NEW_TYPES = {
      category: 'custom',
      choropleth: 'choropleth',
      bubble: 'bubble'
    }.with_indifferent_access.freeze

    def new_legend
      new_type = OLD_TYPES_NEW_TYPES[type]
      new_definition = transformed_definition
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

    def transformed_definition
      case type.to_s
      when 'category'
        build_custom_definition_from_category
      when 'choropleth'
        build_choropleth_definition_from_choropleth
      when 'bubble'
        build_bubble_definition_from_bubble
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

    def build_choropleth_definition_from_choropleth
      { prefix: '', suffix: '' }
    end

    def build_bubble_definition_from_bubble
      { color: items.last['value'] }
    end
  end
end
