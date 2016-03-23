module.exports = {
  'id': '6a31d394-7c8e-11e5-8e42-080027880ca6',
  'version': '0.1.0',
  'title': 'Arboles 2',
  'likes': 0,
  'description': null,
  'scrollwheel': false,
  'legends': true,
  'url': null,
  'map_provider': 'leaflet',
  'bounds': [
    [
      41.340989240001214,
      2.0194244384765625
    ],
    [
      41.47051539294297,
      2.426605224609375
    ]
  ],
  'center': '[41.40578459184651, 2.2230148315429688]',
  'zoom': 12,
  'updated_at': '2016-03-18T12:38:09+00:00',
  'layers': [
    {
      'options': {
        'visible': true,
        'type': 'Tiled',
        'default': true,
        'url': 'http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
        'subdomains': 'abcd',
        'minZoom': '0',
        'maxZoom': '18',
        'name': 'Positron',
        'className': 'httpsbasemapscartocdncomlight_nolabelszxypng',
        'attribution': '© <a href=\'http://www.openstreetmap.org/copyright\'>OpenStreetMap</a> contributors © <a href= \'http://cartodb.com/attributions#basemaps\'>CartoDB</a>',
        'labels': {
          'url': 'http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png'
        },
        'urlTemplate': 'http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
        'id': 'c37a4400-0178-4c27-ac0f-fcedfcdf831a',
        'order': 0
      },
      'infowindow': null,
      'tooltip': null,
      'id': 'c37a4400-0178-4c27-ac0f-fcedfcdf831a',
      'order': 0,
      'type': 'tiled'
    },
    {
      'type': 'namedmap',
      'order': 1,
      'options': {
        'type': 'namedmap',
        'user_name': 'cdb',
        'maps_api_template': 'http://{user}.localhost.lan:8181',
        'sql_api_template': 'http://{user}.localhost.lan:8080',
        'tiler_protocol': 'http',
        'tiler_domain': 'localhost.lan',
        'tiler_port': '8181',
        'filter': 'mapnik',
        'named_map': {
          'name': 'tpl_6a31d394_7c8e_11e5_8e42_080027880ca6',
          'stat_tag': '6a31d394-7c8e-11e5-8e42-080027880ca6',
          'params': {
            'layer0': 1,
            'layer1': 1
          },
          'layers': [
            {
              'id': 'bc6f12e5-b047-46a6-af34-b4b0a31067a0',
              'layer_name': 'untitled_table_24',
              'interactivity': 'cartodb_id,description,name',
              'visible': true,
              'infowindow': {
                'fields': [
                  {
                    'name': 'description',
                    'title': true,
                    'position': 0
                  },
                  {
                    'name': 'name',
                    'title': true,
                    'position': 1
                  }
                ],
                'template_name': 'infowindow_light',
                'template': '<div class=\'cartodb-popup v2\'>\n  <a href=\'#close\' class=\'cartodb-popup-close-button close\'>x</a>\n  <div class=\'cartodb-popup-content-wrapper\'>\n    <div class=\'cartodb-popup-content\'>\n      {{#content.fields}}\n        {{#title}}<h4>{{title}}</h4>{{/title}}\n        {{#value}}\n          <p {{#type}}class=\'{{ type }}\'{{/type}}>{{{ value }}}</p>\n        {{/value}}\n        {{^value}}\n          <p class=\'empty\'>null</p>\n        {{/value}}\n      {{/content.fields}}\n    </div>\n  </div>\n  <div class=\'cartodb-popup-tip-container\'></div>\n</div>\n',
                'alternative_names': {},
                'width': 226,
                'maxHeight': 180
              },
              'tooltip': {
                'fields': [
                  {
                    'name': 'description',
                    'title': true,
                    'position': 0
                  },
                  {
                    'name': 'name',
                    'title': true,
                    'position': 1
                  }
                ],
                'template_name': 'tooltip_light',
                'template': '<div class=\'cartodb-tooltip-content-wrapper\'>\n  <div class=\'cartodb-tooltip-content\'>\n  {{#fields}}\n    {{#title}}\n    <h4>{{title}}</h4>\n    {{/title}}\n    <p>{{{ value }}}</p>\n  {{/fields}}\n  </div>\n</div>',
                'alternative_names': {},
                'maxHeight': 180
              }
            },
            {
              'id': 'f03ac214-9fe6-4b26-a97a-23c664f351d0',
              'layer_name': 'arboles_2',
              'interactivity': 'cartodb_id,description,name',
              'visible': true,
              'infowindow': {
                'fields': [
                  {
                    'name': 'description',
                    'title': true,
                    'position': 0
                  },
                  {
                    'name': 'name',
                    'title': true,
                    'position': 1
                  }
                ],
                'template_name': 'table/views/infowindow_light',
                'template': '<div class=\'cartodb-popup v2\'>\n  <a href=\'#close\' class=\'cartodb-popup-close-button close\'>x</a>\n  <div class=\'cartodb-popup-content-wrapper\'>\n    <div class=\'cartodb-popup-content\'>\n      {{#content.fields}}\n        {{#title}}<h4>{{title}}</h4>{{/title}}\n        {{#value}}\n          <p {{#type}}class=\'{{ type }}\'{{/type}}>{{{ value }}}</p>\n        {{/value}}\n        {{^value}}\n          <p class=\'empty\'>null</p>\n        {{/value}}\n      {{/content.fields}}\n    </div>\n  </div>\n  <div class=\'cartodb-popup-tip-container\'></div>\n</div>\n',
                'alternative_names': {},
                'width': 226,
                'maxHeight': 180
              },
              'tooltip': {
                'fields': [
                  {
                    'name': 'description',
                    'title': true,
                    'position': 0
                  },
                  {
                    'name': 'name',
                    'title': true,
                    'position': 1
                  }
                ],
                'template_name': 'tooltip_light',
                'template': '<div class=\'cartodb-tooltip-content-wrapper\'>\n  <div class=\'cartodb-tooltip-content\'>\n  {{#fields}}\n    {{#title}}\n    <h4>{{title}}</h4>\n    {{/title}}\n    <p>{{{ value }}}</p>\n  {{/fields}}\n  </div>\n</div>',
                'alternative_names': {},
                'maxHeight': 180
              }
            }
          ]
        },
        'attribution': ''
      }
    },
    {
      'options': {
        'visible': true,
        'type': 'Tiled',
        'default': true,
        'url': 'http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png',
        'subdomains': 'abcd',
        'minZoom': '0',
        'maxZoom': '18',
        'attribution': '© <a href=\'http://www.openstreetmap.org/copyright\'>OpenStreetMap</a> contributors © <a href= \'http://cartodb.com/attributions#basemaps\'>CartoDB</a>',
        'urlTemplate': 'http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png',
        'name': 'Positron Labels',
        'id': 'dbc6555a-a051-48a1-8f0c-3f9b51276006',
        'className': 'httpsbasemapscartocdncomlight_only_labelszxypng',
        'order': 3
      },
      'infowindow': null,
      'tooltip': null,
      'id': 'dbc6555a-a051-48a1-8f0c-3f9b51276006',
      'order': 3,
      'type': 'tiled'
    }
  ],
  'overlays': [
    {
      'type': 'share',
      'order': 2,
      'options': {
        'display': true,
        'x': 20,
        'y': 20
      },
      'template': ''
    },
    {
      'type': 'search',
      'order': 3,
      'options': {
        'display': true,
        'x': 60,
        'y': 20
      },
      'template': ''
    },
    {
      'type': 'zoom',
      'order': 6,
      'options': {
        'display': true,
        'x': 20,
        'y': 20
      },
      'template': '<a href=\'#zoom_in\' class=\'zoom_in\'>+</a> <a href=\'#zoom_out\' class=\'zoom_out\'>-</a>'
    },
    {
      'type': 'loader',
      'order': 8,
      'options': {
        'display': true,
        'x': 20,
        'y': 150
      },
      'template': '<div class=\'loader\' original-title=\'\'></div>'
    },
    {
      'type': 'logo',
      'order': 9,
      'options': {
        'display': true,
        'x': 10,
        'y': 40
      },
      'template': ''
    },
    {
      'type': 'layer_selector',
      'order': 4,
      'options': {
        'x': 220,
        'y': 20,
        'display': true
      },
      'template': null
    }
  ],
  'prev': null,
  'next': null,
  'transition_options': {
    'time': 0
  },
  'widgets': [],
  'datasource': {
    'user_name': 'cdb',
    'maps_api_template': 'http://{user}.localhost.lan:8181',
    'stat_tag': '6a31d394-7c8e-11e5-8e42-080027880ca6',
    'template_name': 'tpl_6a31d394_7c8e_11e5_8e42_080027880ca6'
  },
  'user': {
    'fullname': 'cdb',
    'avatar_url': '//example.com/avatars/avatar_stars_blue.png'
  },
  'vector': false
};
