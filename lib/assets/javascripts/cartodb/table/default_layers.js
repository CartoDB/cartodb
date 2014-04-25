cdb.admin.DEFAULT_LAYERS = [
  {
  url: 'https://{s}.maps.nlp.nokia.com/maptile/2.1/maptile/newest/normal.day/{z}/{x}/{y}/256/png8?lg=eng&token=A7tBPacePg9Mj_zghvKt9Q&app_id=KuYppsdXZznpffJsKT24',
  subdomains: '1234',
  minZoom: 0,
  maxZoom: 21,
  name: 'Nokia Day',
  className: "nokia_day",
  attribution: "©2012 Nokia <a href='http://here.net/services/terms' target='_blank'>Terms of use</a>"
}, {
  url: 'https://cartocdn_{s}.global.ssl.fastly.net/base-light/{z}/{x}/{y}.png',
  minZoom: 0,
  maxZoom: 10,
  name: 'CartoDB Light',
  className: "light_cartodb",
  attribution: ""
}, {
  url: 'https://cartocdn_{s}.global.ssl.fastly.net/base-dark/{z}/{x}/{y}.png',
  minZoom: 0,
  maxZoom: 10,
  name: 'CartoDB Dark',
  className: "dark_cartodb",
  attribution: ""
}, {
  url: 'https://cartocdn_{s}.global.ssl.fastly.net/base-antique/{z}/{x}/{y}.png',
  minZoom: 0,
  maxZoom: 10,
  name: 'CartoDB Antique',
  className: "antique_cartodb",
  attribution: ""
}, {
  url: 'https://cartocdn_{s}.global.ssl.fastly.net/base-eco/{z}/{x}/{y}.png',
  minZoom: 0,
  maxZoom: 10,
  name: 'CartoDB Eco',
  className: "eco_cartodb",
  attribution: ""
}, {
  url: 'https://cartocdn_{s}.global.ssl.fastly.net/base-flatblue/{z}/{x}/{y}.png',
  minZoom: 0,
  maxZoom: 10,
  name: 'CartoDB Flat Blue',
  className: "flat_blue",
  attribution: ""
}, {
  url: 'https://cartocdn_{s}.global.ssl.fastly.net/base-midnight/{z}/{x}/{y}.png',
  minZoom: 0,
  maxZoom: 10,
  name: 'CartoDB Midnight Commander',
  className: "midnight_cartodb",
  attribution: ""
}];
