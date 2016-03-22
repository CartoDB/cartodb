FactoryGirl.define do

  factory :layer, class: Layer do
    order 1
    kind 'carto'
  end

  factory :carto_layer, class: Carto::Layer do
    order 1
    kind 'carto'
    options do
      {
        interactivity: '',
        style_version: '2.1.1',
        table_name: '',
        query: nil,
        tile_style: '#something {}'
      }
    end

    factory :carto_layer_with_infowindow do
      infowindow_light = {
        "fields": [{ "name": "country", "title": true, "position": 1 }],
        "template_name": "table/views/infowindow_light",
        "template": "",
        "alternative_names": {},
        "width": 226,
        "maxHeight": 180
      }.to_json

      infowindow infowindow_light
    end

    factory :carto_layer_with_tooltip do
      tooltip_light = {
        "fields": [{ "name": "amount", "title": true, "position": 0 }],
        "template_name": "tooltip_light",
        "template": "",
        "alternative_names": {},
        "maxHeight": 180
      }.to_json

      tooltip tooltip_light
    end
  end

end

module Fixtures
  module Layers
    module Tooltips
      def custom_tooltip(template = 'wadus tooltip')
        {
          "fields": [{ "name": "amount", "title": true, "position": 0 }],
          "template_name": "",
          "template": template,
          "alternative_names": {},
          "maxHeight": 180
        }
      end

      # These depend on tooltip_light.jst.mustache at the following paths:
      # - /lib/assets/javascripts/cartodb/table/views/tooltip/templates/tooltip_light.jst.mustache
      # - /lib/assets/javascripts/cartodb3/mustache-templates/tooltips/tooltip_light.jst.mustache
      def v2_tooltip_light_template_fragment
        '<div class="cartodb-tooltip-content-wrapper">'
      end

      def v3_tooltip_light_template_fragment
        '<div class="CDB-Tooltip CDB-Tooltip--isLight">'
      end
    end

    # These depend on infowindow_light.jst.mustache at the following paths:
    # - /lib/assets/javascripts/cartodb/table/views/infowindow/templates/infowindow_light.jst.mustache
    # - /lib/assets/javascripts/cartodb3/mustache-templates/infowindows/infowindow_light.jst.mustache
    module Infowindows
      def custom_infowindow(template = 'wadus infowindow')
        {
          "fields": [{ "name": "country", "title": true, "position": 1 }],
          "template_name": "",
          "template": template,
          "alternative_names": {},
          "width": 226,
          "maxHeight": 180
        }
      end

      def v2_infowindow_light_template_fragment
        "<div class=\"cartodb-popup v2\">\n  <a href=\"#close\" class=\"cartodb-popup-close-button close\">x</a>\n  "\
        "<div class=\"cartodb-popup-content-wrapper\">\n    <div class=\"cartodb-popup-content\">\n      "\
        "{{#content.fields}}\n        {{#title}}<h4>{{title}}</h4>{{/title}}\n        {{#value}}\n          "\
        "<p {{#type}}class=\"{{ type }}\"{{/type}}>{{{ value }}}</p>\n        {{/value}}\n        "\
        "{{^value}}\n          <p class=\"empty\">null</p>\n        {{/value}}\n      {{/content.fields}}\n    "\
        "</div>\n  </div>\n  <div class=\"cartodb-popup-tip-container\"></div>\n</div>\n"
      end

      def v3_infowindow_light_template_fragment
        '{{#title}}<h5 class="CDB-infowindow-subtitle">{{title}}</h5>{{/title}}'
      end
    end
  end
end
