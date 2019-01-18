module.exports = {
  'bounds': [
    [
      38.994,
      -8.74622
    ],
    [
      42.3508,
      -1.86658
    ]
  ],
  'center': [
    40.67241595,
    -5.306396485
  ],
  'datasource': {
    'user_name': 'iago-carto',
    'maps_api_template': 'https://{user}.carto.com:443',
    'stat_tag': 'd71f6316-b2df-4a33-8109-fa80e8fc793d',
    'template_name': 'tpl_d71f6316_b2df_4a33_8109_fa80e8fc793d'
  },
  'description': null,
  'options': {
    'legends': true,
    'scrollwheel': true,
    'layer_selector': true,
    'dashboard_menu': true
  },
  'id': 'd71f6316-b2df-4a33-8109-fa80e8fc793d',
  'layers': [
    {
      'id': '5bdcb792-78ce-4875-8ab1-869561916426',
      'type': 'tiled',
      'options': {
        'default': 'true',
        'url': 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}.png',
        'subdomains': 'abcd',
        'minZoom': '0',
        'maxZoom': '18',
        'name': 'Positron',
        'className': 'positron_rainbow_labels',
        'attribution': "&copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors",
        'labels': {
          'url': 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_only_labels/{z}/{x}/{y}.png'
        },
        'urlTemplate': 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}.png'
      }
    },
    {
      'id': '1b65ba49-e202-4a0a-bb4d-5d8a416788cd',
      'type': 'CartoDB',
      'visible': true,
      'options': {
        'layer_name': 'lugares',
        'attribution': '',
        'cartocss': '#layer {\n  marker-width: ramp([population], range(6, 33), quantiles(5));\n  marker-fill: #279aff;\n  marker-fill-opacity: 0.9;\n  marker-allow-overlap: true;\n  marker-line-width: 1;\n  marker-line-color: #FFF;\n  marker-line-opacity: 1;\n}',
        'source': 'a0'
      },
      'infowindow': {
        'template_name': 'infowindow_color',
        'fields': [
          {
            'name': 'population',
            'title': true,
            'position': null
          },
          {
            'name': 'description',
            'title': true,
            'position': null
          }
        ],
        'maxHeight': 180,
        'template': "<div class='CDB-infowindow CDB-infowindow--light js-infowindow'>\n  <div class='CDB-infowindow-close js-close'></div>\n  <div class='CDB-infowindow-container'>\n    <div class='CDB-infowindow-header CDB-infowindow-headerBg CDB-infowindow-headerBg--light js-header' style='background: #35AAE5;'>\n      {{#loading}}\u2026{{/loading}}\n      <ul class='CDB-infowindow-list'>\n        {{#content.fields}}\n          {{^index}}\n            <li class='CDB-infowindow-listItem'>\n              {{#title}}<h5 class='CDB-infowindow-subtitle'>{{title}}</h5>{{/title}}\n              {{#value}}<h4 class='CDB-infowindow-title {{#type}}{{ type }}{{/type}}'>{{{ value }}}</h4>{{/value}}\n            </li>\n            {{^value}}{{/value}}\n          {{/index}}\n        {{/content.fields}}\n      </ul>\n    </div>\n    <div class='CDB-infowindow-inner js-inner'>\n      {{#loading}}\n        <div class='CDB-Loader js-loader is-visible'></div>\n      {{/loading}}\n      <ul class='CDB-infowindow-list js-content'>\n        {{#content.fields}}\n          {{#index}}\n            <li class='CDB-infowindow-listItem'>\n              {{#title}}\n                <h5 class='CDB-infowindow-subtitle'>{{title}}</h5>\n              {{/title}}\n              {{#value}}\n                <h4 class='CDB-infowindow-title'>{{{ value }}}</h4>\n              {{/value}}\n              {{^value}}\n                <h4 class='CDB-infowindow-title'>NULL</h4>\n              {{/value}}\n            </li>\n          {{/index}}\n        {{/content.fields}}\n      </ul>\n    </div>\n    <div class='CDB-hook'>\n      <div class='CDB-hook-inner'></div>\n    </div>\n  </div>\n</div>\n",
        'alternative_names': {
          'name': '',
          'description': ''
        },
        'width': 226,
        'headerColor': {
          'color': {
            'fixed': '#35AAE5',
            'opacity': 1
          }
        },
        'template_type': 'mustache'
      },
      'tooltip': {
        'fields': [
          {
            'name': 'name',
            'title': true,
            'position': null
          },
          {
            'name': 'description',
            'title': true,
            'position': null
          }
        ],
        'template_name': 'tooltip_dark',
        'template': "<div class='CDB-Tooltip CDB-Tooltip--isDark'>\n  <ul class='CDB-Tooltip-list'>\n    {{#fields}}\n      <li class='CDB-Tooltip-listItem'>\n        {{#title}}\n          <h3 class='CDB-Tooltip-listTitle'>{{{ title }}}</h3>\n        {{/title}}\n        <h4 class='CDB-Tooltip-listText'>{{{ value }}}</h4>\n      </li>\n    {{/fields}}\n  </ul>\n</div>\n",
        'template_type': 'mustache'
      },
      'legends': [
        {
          'conf': {
            'columns': [
              'title'
            ]
          },
          'created_at': '2017-08-31T14:58:44+00:00',
          'definition': {
            'categories': [
              {
                'title': 'Iago',
                'color': '#279aff'
              },
              {
                'title': 'Pablo',
                'color': '#e7c5ce'
              },
              {
                'title': 'Untitled',
                'color': '#528995'
              }
            ]
          },
          'id': 'cc81d782-0037-4cba-9575-abe817147bfa',
          'layer_id': '1b65ba49-e202-4a0a-bb4d-5d8a416788cd',
          'post_html': '',
          'pre_html': '',
          'title': 'Wadus',
          'type': 'custom',
          'updated_at': '2017-08-31T14:59:29+00:00'
        }
      ]
    },
    {
      'id': 'a58f47f9-7fb2-4539-a7e6-dcedd7adc9e4',
      'type': 'tiled',
      'options': {
        'default': 'true',
        'url': 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_only_labels/{z}/{x}/{y}.png',
        'subdomains': 'abcd',
        'minZoom': '0',
        'maxZoom': '18',
        'attribution': "&copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors",
        'urlTemplate': 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_only_labels/{z}/{x}/{y}.png',
        'type': 'Tiled',
        'name': 'Positron Labels'
      }
    }
  ],
  'likes': 0,
  'map_provider': 'leaflet',
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
      'options': null,
      'template': null
    },
    {
      'type': 'zoom',
      'order': 6,
      'options': null,
      'template': null
    },
    {
      'type': 'loader',
      'order': 8,
      'options': {
        'display': true,
        'x': 20,
        'y': 150
      },
      'template': "<div class='loader' original-title=''></div>"
    },
    {
      'type': 'logo',
      'order': 10,
      'options': null,
      'template': null
    }
  ],
  'title': 'Cities',
  'updated_at': '2017-08-31T15:36:12+00:00',
  'user': {
    'fullname': 'Iago Lastra',
    'avatar_url': 'https://s3.amazonaws.com/com.cartodb.users-assets.production/production/iago-carto/assets/20170720105148Avatar250.png',
    'profile_url': 'https://team.carto.com/u/iago-carto'
  },
  'version': '3.0.0',
  'widgets': [
    {
      'id': '30a96a5d-349d-49c4-875a-c6eba7485635',
      'type': 'category',
      'title': 'name',
      'order': 0,
      'layer_id': '1b65ba49-e202-4a0a-bb4d-5d8a416788cd',
      'options': {
        'column': 'name',
        'aggregation_column': 'name',
        'aggregation': 'count',
        'column_type': 'string',
        'sync_on_bbox_change': true
      },
      'style': {
        'widget_style': {
          'definition': {
            'color': {
              'fixed': '#9DE0AD',
              'opacity': 1
            }
          },
          'widget_color_changed': false
        },
        'auto_style': {
          'custom': false,
          'allowed': true
        }
      },
      'source': {
        'id': 'a0'
      }
    },
    {
      'id': '3d26c92f-0244-4479-9fc0-fb0715283ecd',
      'type': 'histogram',
      'title': 'population',
      'order': 2,
      'layer_id': '1b65ba49-e202-4a0a-bb4d-5d8a416788cd',
      'options': {
        'column': 'population',
        'bins': 10,
        'column_type': 'number',
        'sync_on_bbox_change': true
      },
      'style': {
        'widget_style': {
          'definition': {
            'color': {
              'fixed': '#9DE0AD',
              'opacity': 1
            }
          },
          'widget_color_changed': false
        },
        'auto_style': {
          'custom': false,
          'allowed': true
        }
      },
      'source': {
        'id': 'a0'
      }
    },
    {
      'id': 'd0d44271-43ef-468f-b2e5-64f4a266daa4',
      'type': 'category',
      'title': 'name',
      'order': 3,
      'layer_id': '1b65ba49-e202-4a0a-bb4d-5d8a416788cd',
      'options': {
        'column': 'name',
        'aggregation_column': 'name',
        'aggregation': 'count',
        'column_type': 'string',
        'sync_on_bbox_change': true
      },
      'style': {
        'widget_style': {
          'definition': {
            'color': {
              'fixed': '#9DE0AD',
              'opacity': 1
            }
          },
          'widget_color_changed': false
        },
        'auto_style': {
          'custom': false,
          'allowed': true
        }
      },
      'source': {
        'id': 'a0'
      }
    }
  ],
  'zoom': 6,
  'analyses': [
    {
      'id': 'a0',
      'type': 'source',
      'options': {
        'table_name': "'iago-carto'.lugares",
        'simple_geom': 'point'
      }
    }
  ],
  'vector': false
};
