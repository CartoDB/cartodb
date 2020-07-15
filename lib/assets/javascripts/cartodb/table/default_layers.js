cdb.admin.DEFAULT_BASEMAPS = {
'CartoDB': [{
    url: 'http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 18,
    name: 'Positron',
    className: "positron_rainbow_labels",
    attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/about-carto/">CARTO</a>',
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
    attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/about-carto/">CARTO</a>',
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
    attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/about-carto/">CARTO</a>'
  }, {
    url: 'http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 18,
    name: 'Dark matter (labels below)',
    className: "dark_matter_rainbow",
    attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/about-carto/">CARTO</a>'
  }, {
    url: 'http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 18,
    name: 'Positron (lite)',
    className: "positron_lite_rainbow",
    attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/about-carto/">CARTO</a>'
  }, {
    url: 'http://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 18,
    name: 'Dark matter (lite)',
    className: "dark_matter_lite_rainbow",
    attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/about-carto/">CARTO</a>'
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
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.',
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
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.'
  }, {
    url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/toner-background/{z}/{x}/{y}.png',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 18,
    name: 'Toner Background',
    className: "toner_background_stamen",
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.'
  }, {
    url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 18,
    name: 'Toner Lite',
    className: "toner_lite_stamen",
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.'
  }, {
    url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lines/{z}/{x}/{y}.png',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 18,
    name: 'Toner Lines',
    className: "toner_lines_stamen",
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.'
  }, {
    url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/toner-hybrid/{z}/{x}/{y}.png',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 18,
    name: 'Toner Hybrid',
    className: "toner_hybrid_stamen",
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.'
  }, {
    url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.png',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 18,
    name: 'Watercolor',
    className: "watercolor_stamen",
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>.'
  }]
}
