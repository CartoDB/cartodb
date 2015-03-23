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
            layer.options['tile_style'] << "\n##{matches[1]}[opened=true]{marker-fill: #006600;\n}"
          end

          nil
        end

      end
    end
  end
end
