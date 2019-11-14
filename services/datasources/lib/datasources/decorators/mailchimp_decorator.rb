require_relative './base_decorator'

module CartoDB
  module Datasources
    module Decorators
      class MailchimpDecorator < BaseDecorator

        CATEGORY_COLUMN = 'opened'

        CSS_PROPERTIES = {
          "marker-opacity" => 1,
          "marker-fill-opacity" => 0.5,
          "marker-line-color" => "#FFF",
          "marker-line-width" => 1,
          "marker-line-opacity" => 1,
          "marker-placement" => "point",
          "marker-type" => "ellipse",
          "marker-width" => 6,
          "marker-allow-overlap" => true,
          "marker-comp-op" => 'multiply'
        }

        CATEGORIES = [
          {
            title: true,
            color: "#A53ED5"
          },
          {
            title: false,
            color: "#00ceff"
          }
        ]

        # @return bool
        def decorates_layer?
          true
        end

        # @param layer Layer|nil
        # @return bool
        def layer_eligible?(layer=nil)
          return false if layer.nil?
          # Only data/cartodb layers
          return false unless layer.respond_to?(:data_layer?)
          layer.data_layer?
        end

        # @param layer Layer|nil
        def decorate_layer!(layer=nil)
          return nil unless layer_eligible?(layer)

          enable_category_wizard(layer)
          enable_category_legend(layer)
          set_carto_css(layer)

          nil
        end

        private

        def enable_category_wizard(layer)
          wizard_properties = {
            type: "category",
            properties: {
              property: CATEGORY_COLUMN,
              "geometry_type" => "point",
              categories: []
            }
          }
          wizard_properties[:properties].merge!(CSS_PROPERTIES)
          wizard_properties[:properties][:categories] = CATEGORIES.map do |category|
            {
              "title" => category[:title],
              "title_type" => "boolean",
              "color" => category[:color],
              "value_type" => "color"
            }
          end

          layer.set_option('wizard_properties', wizard_properties)
        end

        def enable_category_legend(layer)
          legend = {
            "type" => "category",
            "show_title" => false,
            "title" => "",
            "template" => "",
            "visible" => true
          }
          legend[:items] = CATEGORIES.map do |category|
            {
              name: category[:title].to_s,
              visible: true,
              value: category[:color]
            }
          end

          layer.set_option(:legend, legend)
        end

        def set_carto_css(layer)
          matches = layer.options['tile_style'].match(/^#(.*) \{/)
          unless matches.nil?
            css_selector = "##{matches[1]}"
            css_properties = CSS_PROPERTIES.map{|property, value| "    #{property}: #{value};"}.join("\n")

            carto_css = []
            carto_css << "#{css_selector} {"
            carto_css << css_properties
            carto_css << "    [zoom>4] {"
            carto_css << "        marker-width: 7;"
            carto_css << "    }"
            carto_css << "    [zoom>5] {"
            carto_css << "        marker-width: 8;"
            carto_css << "    }"
            carto_css << "    [zoom>6] {"
            carto_css << "        marker-width: 9;"
            carto_css << "    }"
            carto_css << "}"

            CATEGORIES.each do |category|
              carto_css << "#{css_selector}[#{CATEGORY_COLUMN}=#{category[:title]}] {"
              carto_css << "    marker-fill: #{category[:color]};"
              carto_css << "}"
            end

            layer.set_option('tile_style', carto_css.join("\n"))
            layer.set_option('tile_style_custom', false)
          end
        end
      end
    end
  end
end
