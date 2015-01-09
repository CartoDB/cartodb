# encoding: utf-8
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
        # @return Layer|nil
        def decorate_layer(layer=nil)
          return nil if layer.nil?
          return layer unless layer.respond_to?('data_layer?'.to_sym)

          # Only data/cartodb layers
          return layer unless layer.data_layer?

          layer.infowindow = {
            fields: [
              {position: 0, name: "caption", title: true},
              {position: 1, name: "comments_count", title: true},
              {position: 2, name: "created_time", title: true},
              {position: 3, name: "image", title: true},
              {position: 4, name: "lat", title: true},
              {position: 5, name: "likes_count", title: true},
              {position: 6, name: "link", title: true},
              {position: 7, name: "location_id", title: true},
              {position: 8, name: "location_name", title: true},
              {position: 9, name: "lon", title: true},
              {position: 10, name: "tags", title: true},
              {position: 11, name: "thumbnail", title: true},
              {position: 12, name: "type", title: true}
            ],
            template_name: "",
            alternative_names: {},
            maxHeight: 275,
            width: 226,
            template: '<div class="cartodb-popup v2"><a href="#close" class="cartodb-popup-close-button close">x</a><div class="cartodb-popup-content-wrapper"><div class="cartodb-popup-content"><p><img src="{{thumbnail}}"/></p><p>{{caption}}</p><p>Likes: {{likes_count}}</p><p>Comments: {{comments_count}}</p><p><a href="{{link}}">View photo</a></p></div></div><div class="cartodb-popup-tip-container"></div></div>'
          }

          layer.save
          layer
        end

      end
    end
  end
end
