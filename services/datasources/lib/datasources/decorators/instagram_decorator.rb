require_relative './base_decorator'

module CartoDB
  module Datasources
    module Decorators
      class InstagramDecorator < BaseDecorator

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

          layer.infowindow = {
            fields: [
              {position: 0, name: "thumbnail", title: true},
              {position: 1, name: "caption", title: true},
              {position: 2, name: "comments_count", title: true},
              {position: 3, name: "likes_count", title: true},
              {position: 4, name: "link", title: true}
            ],
            template_name: "infowindow_header_with_image",
            alternative_names: {},
            maxHeight: 275,
            width: 226,
            template: ""
          }
          nil
        end

      end
    end
  end
end
