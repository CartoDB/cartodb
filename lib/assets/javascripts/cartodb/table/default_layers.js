
cdb.admin.DEFAUL_LAYERS = [
  {
    url: 'https://dnv9my2eseobd.cloudfront.net/v3/mapbox.mapbox-streets/{z}/{x}/{y}.png',
    maxZoom: 17,
    name: 'Streets (Mapbox)',
    className: "mapbox_streets",
    attribution: "Mapbox <a href='http://mapbox.com/about/maps' target='_blank'>Terms &amp; Feedback</a>"
  }, {
    url: 'https://dnv9my2eseobd.cloudfront.net/v3/mapbox.mapbox-light/{z}/{x}/{y}.png',
    maxZoom: 17,
    name: 'Light (Mapbox)',
    className: "mapbox_light",
    attribution: "Mapbox <a href='http://mapbox.com/about/maps' target='_blank'>Terms &amp; Feedback</a>"
  }, {
    url: 'https://dnv9my2eseobd.cloudfront.net/v3/cartodb.map-4xtxp73f/{z}/{x}/{y}.png',
    maxZoom: 17,
    name: 'Graphite (Mapbox)',
    className: "mapbox_graphite",
    attribution: "Mapbox <a href='http://mapbox.com/about/maps' target='_blank'>Terms &amp; Feedback</a>"
  }, {
    url: 'https://dnv9my2eseobd.cloudfront.net/v3/cartodb.map-uulyudas/{z}/{x}/{y}.png',
    maxZoom: 17,
    name: 'Warden (Mapbox)',
    className: "mapbox_warden",
    attribution: "Mapbox <a href='http://mapbox.com/about/maps' target='_blank'>Terms &amp; Feedback</a>"
  }, {
    url: 'https://tile.stamen.com/toner/{z}/{x}/{y}.png',
    maxZoom: 17,
    name: 'Toner (Stamen)',
    className: "stamen_toner",
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>'
  }, {
    url: 'https://maps.nlp.nokia.com/maptiler/v2/maptile/newest/normal.day/{z}/{x}/{y}/256/png8?lg=eng&token=61YWYROufLu_f8ylE0vn0Q&app_id=qIWDkliFCtLntLma2e6O',
    maxZoom: 17,
    name: 'Day (Nokia)',
    className: "nokia_day",
    attribution: "©2012 Nokia <a href='http://here.net/services/terms' target='_blank'>Terms of use</a>"
  }
];
