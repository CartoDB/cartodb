# encoding: utf-8
require_relative './base_decorator'

module CartoDB
  module Datasources
    module Decorators
      class MailchimpDecorator < BaseDecorator

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

          matches = /^#(.*) \{/.match(layer.options['tile_style'])
          unless matches.nil?
            layer.set_style_options(
              "##{matches[1]}{\n" <<
              " marker-fill-opacity: 0.5;\n" <<
              " marker-line-color: #FFF;\n" <<
              " marker-line-width: 1;\n" <<
              " marker-line-opacity: 1;\n" <<
              " marker-placement: point;\n" <<
              " marker-type: ellipse;\n" <<
              " marker-width: 6;\n" <<
              " [zoom>4]{\n" <<
              " marker-width: 7;\n" <<
              " }\n" <<
              " [zoom>5]{\n" <<
              " marker-width: 8;\n" <<
              " }\n" <<
              " [zoom>6]{\n" <<
              " marker-width: 9;\n" <<
              " }\n" <<
              " marker-allow-overlap: true;\n" <<
              " marker-comp-op: multiply;\n" <<
              "}\n" <<
              "\n##{matches[1]}[opened=true]{\n" <<
              " marker-fill: #A53ED5;\n" <<
              "}\n" <<
              "\n##{matches[1]}[opened=false]{\n" <<
              " marker-fill: #00ceff;\n" <<
              "}"
            )
          end

          nil
        end

      end
    end
  end
end
