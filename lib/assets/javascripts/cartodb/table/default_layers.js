cdb.admin.DEFAULT_LAYERS = [ {
  url: 'https://{s}.maps.nlp.nokia.com/maptile/2.1/maptile/newest/normal.day/{z}/{x}/{y}/256/png8?lg=eng&token=A7tBPacePg9Mj_zghvKt9Q&app_id=KuYppsdXZznpffJsKT24',
  subdomains: '1234',
  minZoom: 0,
  maxZoom: 21,
  name: 'Nokia Day',
  className: "nokia_day",
  attribution: "©2012 Nokia <a href='http://here.net/services/terms' target='_blank'>Terms of use</a>"
}, {
  url: 'https://{s}.maps.nlp.nokia.com/maptile/2.1/maptile/newest/normal.day.grey/{z}/{x}/{y}/256/png8?lg=eng&token=A7tBPacePg9Mj_zghvKt9Q&app_id=KuYppsdXZznpffJsKT24',
  subdomains: '1234',
  minZoom: 0,
  maxZoom: 21,
  name: 'Nokia Day Grey',
  className: "nokia_day_grey",
  attribution: "©2012 Nokia <a href='http://here.net/services/terms' target='_blank'>Terms of use</a>"
}, {
  url: 'https://{s}.maps.nlp.nokia.com/maptile/2.1/maptile/newest/normal.night/{z}/{x}/{y}/256/png8?lg=eng&token=A7tBPacePg9Mj_zghvKt9Q&app_id=KuYppsdXZznpffJsKT24',
  subdomains: '1234',
  minZoom: 0,
  maxZoom: 21,
  name: 'Nokia Night',
  className: "nokia_night",
  attribution: "©2012 Nokia <a href='http://here.net/services/terms' target='_blank'>Terms of use</a>"
}, {
  url: 'https://{s}.maps.nlp.nokia.com/maptile/2.1/maptile/newest/normal.day.transit/{z}/{x}/{y}/256/png8?lg=eng&token=A7tBPacePg9Mj_zghvKt9Q&app_id=KuYppsdXZznpffJsKT24',
  subdomains: '1234',
  minZoom: 0,
  maxZoom: 21,
  name: 'Nokia Day Transit',
  className: "nokia_day_transit",
  attribution: "©2012 Nokia <a href='http://here.net/services/terms' target='_blank'>Terms of use</a>"
}, {
  url: 'https://{s}.maps.nlp.nokia.com/maptile/2.1/maptile/newest/carnav.day.grey/{z}/{x}/{y}/256/png8?lg=eng&token=A7tBPacePg9Mj_zghvKt9Q&app_id=KuYppsdXZznpffJsKT24',
  subdomains: '1234',
  minZoom: 0,
  maxZoom: 21,
  name: 'Nokia Carnav Day Grey',
  className: "nokia_carnav_day_grey",
  attribution: "©2012 Nokia <a href='http://here.net/services/terms' target='_blank'>Terms of use</a>"
}, {
  url: 'https://{s}.maps.nlp.nokia.com/maptile/2.1/maptile/newest/terrain.day/{z}/{x}/{y}/256/png8?lg=eng&token=A7tBPacePg9Mj_zghvKt9Q&app_id=KuYppsdXZznpffJsKT24',
  subdomains: '1234',
  minZoom: 0,
  maxZoom: 21,
  name: 'Nokia Terrain Day',
  className: "nokia_terrain_day",
  attribution: "©2012 Nokia <a href='http://here.net/services/terms' target='_blank'>Terms of use</a>"
}, {
  url: 'https://{s}.maps.nlp.nokia.com/maptile/2.1/maptile/newest/hybrid.day/{z}/{x}/{y}/256/png8?lg=eng&token=A7tBPacePg9Mj_zghvKt9Q&app_id=KuYppsdXZznpffJsKT24',
  subdomains: '1234',
  minZoom: 0,
  maxZoom: 21,
  name: 'Nokia Hybrid Day',
  className: "nokia_hybrid_day",
  attribution: "©2012 Nokia <a href='http://here.net/services/terms' target='_blank'>Terms of use</a>"
}, {
  url: 'https://{s}.maps.nlp.nokia.com/maptile/2.1/maptile/newest/satellite.day/{z}/{x}/{y}/256/png8?lg=eng&token=A7tBPacePg9Mj_zghvKt9Q&app_id=KuYppsdXZznpffJsKT24',
  subdomains: '1234',
  minZoom: 0,
  maxZoom: 21,
  name: 'Nokia Satellite Day',
  className: "nokia_satellite_day",
  attribution: "©2012 Nokia <a href='http://here.net/services/terms' target='_blank'>Terms of use</a>"
}, {
  url: 'https://{s}.maps.nlp.nokia.com/maptile/2.1/maptile/newest/reduced.day/{z}/{x}/{y}/256/png8?lg=eng&token=A7tBPacePg9Mj_zghvKt9Q&app_id=KuYppsdXZznpffJsKT24',
  subdomains: '1234',
  minZoom: 0,
  maxZoom: 21,
  name: 'Nokia Reduced Day',
  className: "nokia_reduced_day",
  attribution: "©2012 Nokia <a href='http://here.net/services/terms' target='_blank'>Terms of use</a>"
}, {
  url: 'https://cartocdn_{s}.global.ssl.fastly.net/base-light/{z}/{x}/{y}.png',
  subdomains: 'abcd',
  minZoom: 0,
  maxZoom: 10,
  name: 'CartoDB Light',
  className: "light_cartodb",
  attribution: ""
}, {
  url: 'https://cartocdn_{s}.global.ssl.fastly.net/base-dark/{z}/{x}/{y}.png',
  subdomains: 'abcd',
  minZoom: 0,
  maxZoom: 10,
  name: 'CartoDB Dark',
  className: "dark_cartodb",
  attribution: ""
}, {
  url: 'https://cartocdn_{s}.global.ssl.fastly.net/base-antique/{z}/{x}/{y}.png',
  subdomains: 'abcd',
  minZoom: 0,
  maxZoom: 10,
  name: 'CartoDB Antique',
  className: "antique_cartodb",
  attribution: ""
}, {
  url: 'https://cartocdn_{s}.global.ssl.fastly.net/base-eco/{z}/{x}/{y}.png',
  subdomains: 'abcd',
  minZoom: 0,
  maxZoom: 10,
  name: 'CartoDB Eco',
  className: "eco_cartodb",
  attribution: ""
}, {
  url: 'https://cartocdn_{s}.global.ssl.fastly.net/base-flatblue/{z}/{x}/{y}.png',
  subdomains: 'abcd',
  minZoom: 0,
  maxZoom: 10,
  name: 'CartoDB Flat Blue',
  className: "flat_blue",
  attribution: ""
}, {
  url: 'https://cartocdn_{s}.global.ssl.fastly.net/base-midnight/{z}/{x}/{y}.png',
  subdomains: 'abcd',
  minZoom: 0,
  maxZoom: 10,
  name: 'CartoDB Midnight Commander',
  className: "midnight_cartodb",
  attribution: ""
}, {
  url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.png',
  subdomains: 'abcd',
  minZoom: 0,
  maxZoom: 10,
  name: 'Toner',
  className: "toner_stamen",
  attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.'
}, {
  url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/toner-background/{z}/{x}/{y}.png',
  subdomains: 'abcd',
  minZoom: 0,
  maxZoom: 10,
  name: 'Toner Background',
  className: "toner_background_stamen",
  attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.'
}, {
  url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png',
  subdomains: 'abcd',
  minZoom: 0,
  maxZoom: 10,
  name: 'Toner Lite',
  className: "toner_lite_stamen",
  attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.'
}, {
  url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lines/{z}/{x}/{y}.png',
  subdomains: 'abcd',
  minZoom: 0,
  maxZoom: 10,
  name: 'Toner Lines',
  className: "toner_lines_stamen",
  attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.'
}, {
  url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/toner-hybrid/{z}/{x}/{y}.png',
  subdomains: 'abcd',
  minZoom: 0,
  maxZoom: 10,
  name: 'Toner Hybrid',
  className: "toner_hybrid_stamen",
  attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.'
}, {
  url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.png',
  subdomains: 'abcd',
  minZoom: 0,
  maxZoom: 10,
  name: 'Watercolor',
  className: "watercolor_stamen",
  attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>.'
}, {
  url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.png',
  subdomains: 'abcd',
  minZoom: 4,
  maxZoom: 10,
  name: 'Terrain',
  className: "terrain_stamen",
  attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>.'
}];
