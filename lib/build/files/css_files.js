var _ = require('underscore');

module.exports = css_files = {

  cdb: [
    '<%= assets_dir %>/stylesheets/map/leaflet.css',
    '<%= assets_dir %>/stylesheets/vendor/cartodb.css'
  ],

  common: [
    '<%= assets_dir %>/stylesheets/common/**/*.css',
    '<%= assets_dir %>/stylesheets/elements/**/*.css',
    '<%= assets_dir %>/stylesheets/plugins/**/*.css'
  ],

  dashboard: [
    '<%= assets_dir %>/stylesheets/dashboard/**/*.css'
  ],

  front: [
    '<%= assets_dir %>/stylesheets/front/**/*.css'
  ],

  keys: [
    '<%= assets_dir %>/stylesheets/keys/**/*.css'
  ],

  leaflet: [
    '<%= assets_dir %>/stylesheets/map/leaflet.css'
  ],

  map: [
    '<%= assets_dir %>/stylesheets/map/**/*.css'
  ],

  organization: [
    '<%= assets_dir %>/stylesheets/organization/**/*.css'
  ],

  pages: [
    '<%= assets_dir %>/stylesheets/pages/**/*.css'
  ],

  embeds: [
    '<%= assets_dir %>/stylesheets/vendor/cartodb.css',
  ],

  specs: [
    '<%= assets_dir %>/stylesheets/specs/**/*.css'
  ],

  table: [
    '<%= assets_dir %>/stylesheets/vendor/codemirror.css',
    '<%= assets_dir %>/stylesheets/vendor/show-hint.css',
    '<%= assets_dir %>/stylesheets/vendor/cartodb.css',
    '<%= assets_dir %>/stylesheets/table/**/*.css'
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
  'embeds',
  'specs',
  'table'
];

var all_css = [];
for(var f in _all_css){
  all_css = all_css.concat(css_files[_all_css[f]]);
}

module.exports.all_css = all_css;

