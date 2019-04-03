cdb.admin.DEFAULT_BASEMAPS = {
'CartoDB': [{
    url: 'http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 18,
    name: 'Positron',
    className: "positron_rainbow_labels",
    attribution: _t('cartodb.table.default_layers.attribution'),
    labels: {
      url: 'http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png'
    }
  }, {
    url: 'http://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 18,
    name: '',
    className: "dark_matter_rainbow_labels",
    attribution: _t('cartodb.table.default_layers.attribution'),
    labels: {
      url: 'http://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}.png'
    }
  }, {
    url: 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 18,
    name: 'Positron (labels below)',
    className: "positron_rainbow",
    attribution: _t('cartodb.table.default_layers.attribution')
  }, {
    url: 'http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 18,
    name: 'Dark matter (labels below)',
    className: "dark_matter_rainbow",
    attribution: _t('cartodb.table.default_layers.attribution')
  }, {
    url: 'http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 18,
    name: 'Positron (lite)',
    className: "positron_lite_rainbow",
    attribution: _t('cartodb.table.default_layers.attribution')
  }, {
    url: 'http://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 18,
    name: 'Dark matter (lite)',
    className: "dark_matter_lite_rainbow",
    attribution: _t('cartodb.table.default_layers.attribution')
  }, {
    url: 'https://cartocdn_{s}.global.ssl.fastly.net/base-antique/{z}/{x}/{y}.png',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 10,
    name: 'CartoDB World Antique',
    className: "antique_cartodb",
    attribution: ""
  }, {
    url: 'https://cartocdn_{s}.global.ssl.fastly.net/base-eco/{z}/{x}/{y}.png',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 10,
    name: 'CartoDB World Eco',
    className: "eco_cartodb",
    attribution: ""
  }, {
    url: 'https://cartocdn_{s}.global.ssl.fastly.net/base-flatblue/{z}/{x}/{y}.png',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 10,
    name: 'CartoDB World Flat Blue',
    className: "flat_blue",
    attribution: ""
  }, {
    url: 'https://cartocdn_{s}.global.ssl.fastly.net/base-midnight/{z}/{x}/{y}.png',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 10,
    name: 'CartoDB World Midnight Commander',
    className: "midnight_cartodb",
    attribution: ""
  }
],

'Stamen': [{
    url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/toner-background/{z}/{x}/{y}.png',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 18,
    name: 'Toner',
    className: "toner_stamen_labels",
    attribution: _t('cartodb.table.default_layers.attr_stamen'),
    labels: {
      url: 'http://{s}.tile.stamen.com/toner-labels/{z}/{x}/{y}.png'
    }
  }, {
    url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.png',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 18,
    name: 'Toner (labels below)',
    className: "toner_stamen",
    attribution: _t('cartodb.table.default_layers.attr_stamen')
  }, {
    url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/toner-background/{z}/{x}/{y}.png',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 18,
    name: 'Toner Background',
    className: "toner_background_stamen",
    attribution: _t('cartodb.table.default_layers.attr_stamen')
  }, {
    url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 18,
    name: 'Toner Lite',
    className: "toner_lite_stamen",
    attribution: _t('cartodb.table.default_layers.attr_stamen')
  }, {
    url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lines/{z}/{x}/{y}.png',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 18,
    name: 'Toner Lines',
    className: "toner_lines_stamen",
    attribution: _t('cartodb.table.default_layers.attr_stamen')
  }, {
    url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/toner-hybrid/{z}/{x}/{y}.png',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 18,
    name: 'Toner Hybrid',
    className: "toner_hybrid_stamen",
    attribution: _t('cartodb.table.default_layers.attr_stamen')
  }, {
    url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.png',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 18,
    name: 'Watercolor',
    className: "watercolor_stamen",
    attribution: _t('cartodb.table.default_layers.attr_stamen')
  }]
}
