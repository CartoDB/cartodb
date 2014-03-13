var _ = require('underscore');

module.exports = css_files = {

  cdb: [
    '../../public/stylesheets/map/leaflet.css',
    '../../public/stylesheets/vendor/cartodb.css'
  ],

  common: [
    '../../public/stylesheets/common/**/*.css',
    '../../public/stylesheets/elements/**/*.css',
    '../../public/stylesheets/plugins/**/*.css'
  ],

  dashboard: [
    '../../public/stylesheets/dashboard/**/*.css'
  ],

  front: [
    '../../public/stylesheets/front/**/*.css'
  ],

  keys: [
    '../../public/stylesheets/keys/**/*.css'
  ],

  leaflet: [
    '../../public/stylesheets/map/leaflet.css'
  ],

  map: [
    '../../public/stylesheets/map/**/*.css'
  ],

  organization: [
    '../../public/stylesheets/organization/**/*.css'
  ],

  pages: [
    '../../public/stylesheets/pages/**/*.css'
  ],

  specs: [
    '../../public/stylesheets/specs/**/*.css'
  ],

  table: [
    '../../public/stylesheets/vendor/codemirror.css',
    '../../public/stylesheets/vendor/show-hint.css',
    '../../public/stylesheets/table/**/*.css'
  ]

};


var _all_css = [
  'cdb',
  'common',
  'dashboard',
  'front',
  'keys',
  'leaflet',
  'map',
  'organization',
  'pages',
  'specs',
  'table'
];

var all_css = [];
for(var f in _all_css){
  all_css = all_css.concat(css_files[_all_css[f]]);
}

module.exports.all_css = all_css;

