cdb.admin.DEFAULT_LAYERS = [
  {
  url: 'https://maps.nlp.nokia.com/maptiler/v2/maptile/newest/normal.day/{z}/{x}/{y}/256/png8?lg=eng&token=A7tBPacePg9Mj_zghvKt9Q&app_id=KuYppsdXZznpffJsKT24',
  maxZoom: 21,
  name: 'Nokia Day',
  className: "nokia_day",
  attribution: "©2012 Nokia <a href='http://here.net/services/terms' target='_blank'>Terms of use</a>"
}, {
  url: 'http://{s}.api.cartocdn.com/basemap-light/{z}/{x}/{y}.png',
  maxZoom: 21,
  name: 'Light CartoDB',
  className: "light_cartodb",
  attribution: "©2013 CartoDB <a href='http://cartodb.com' target='_blank'>Terms of use</a>"
}, {
  url: 'http://{s}.api.cartocdn.com/basemap-dark/{z}/{x}/{y}.png',
  maxZoom: 21,
  name: 'Dark CartoDB',
  className: "dark_cartodb",
  attribution: "©2013 CartoDB <a href='http://cartodb.com' target='_blank'>Terms of use</a>"
}, {
  url: 'http://{s}.api.cartocdn.com/basemap-flatblue/{z}/{x}/{y}.png',
  maxZoom: 21,
  name: 'Flat Blue CartoDB',
  className: "flat_blue",
  attribution: "©2013 CartoDB <a href='http://cartodb.com' target='_blank'>Terms of use</a>"
} ];
