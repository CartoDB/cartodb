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

  common_data: [
    '<%= assets_dir %>/stylesheets/common_data/**/*.css'
  ],

  public_dashboard: [
    '<%= assets_dir %>/stylesheets/common/**/*.css',
    '<%= assets_dir %>/stylesheets/elements/dropdown.css',
    '<%= assets_dir %>/stylesheets/public/public_header.css',
    '<%= assets_dir %>/stylesheets/public/public_footer.css',
    '<%= assets_dir %>/stylesheets/public/public_dropdown.css',
    '<%= assets_dir %>/stylesheets/public_dashboard/**/*.css'
  ],

  public_table: [
    '<%= assets_dir %>/stylesheets/common/**/*.css',
    '<%= assets_dir %>/stylesheets/table/table.css',
    '<%= assets_dir %>/stylesheets/elements/modal.css',
    '<%= assets_dir %>/stylesheets/elements/dialog_small_edit.css',
    '<%= assets_dir %>/stylesheets/elements/dropdown.css',
    '<%= assets_dir %>/stylesheets/elements/duplicate_dialog.css',
    '<%= assets_dir %>/stylesheets/elements/duplicate_table_dialog.css',
    '<%= assets_dir %>/stylesheets/public/public_header.css',
    '<%= assets_dir %>/stylesheets/public/public_map_footer.css',
    '<%= assets_dir %>/stylesheets/public/public_dropdown.css',
    '<%= assets_dir %>/stylesheets/public/public_map_wrapper.css',
    '<%= assets_dir %>/stylesheets/public/public_table_wrapper.css',
    '<%= assets_dir %>/stylesheets/public/public_map_data.css',
    '<%= assets_dir %>/stylesheets/public/public_map_body.css',
    '<%= assets_dir %>/stylesheets/public/public_map_info.css',
    '<%= assets_dir %>/stylesheets/public/public_share_dialog.css',
    '<%= assets_dir %>/stylesheets/public/public_export.css',
    '<%= assets_dir %>/stylesheets/public_table/**/*.css',
    '<%= assets_dir %>/stylesheets/public/public_map_fullscreen.css'
  ],

  public_map: [
    '<%= assets_dir %>/stylesheets/common/**/*.css',
    '<%= assets_dir %>/stylesheets/elements/modal.css',
    '<%= assets_dir %>/stylesheets/elements/dropdown.css',
    '<%= assets_dir %>/stylesheets/elements/duplicate_dialog.css',
    '<%= assets_dir %>/stylesheets/public/public_header.css',
    '<%= assets_dir %>/stylesheets/public/public_map_footer.css',
    '<%= assets_dir %>/stylesheets/public/public_dropdown.css',
    '<%= assets_dir %>/stylesheets/public/public_map_wrapper.css',
    '<%= assets_dir %>/stylesheets/public/public_map_data.css',
    '<%= assets_dir %>/stylesheets/public/public_map_body.css',
    '<%= assets_dir %>/stylesheets/public/public_map_info.css',
    '<%= assets_dir %>/stylesheets/public/public_share_dialog.css',
    '<%= assets_dir %>/stylesheets/public/public_export.css',
    '<%= assets_dir %>/stylesheets/public/public_not_supported_dialog.css',
    '<%= assets_dir %>/stylesheets/public_table/public_table.css',
    '<%= assets_dir %>/stylesheets/public_map/**/*.css',
    '<%= assets_dir %>/stylesheets/public/public_map_fullscreen.css'
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

  cartodb: [
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
  'public_dashboard',
  'public_table',
  'public_map',
  'organization',
  'pages',
  'cartodb',
  'specs',
  'table'
];

var all_css = [];
for(var f in _all_css){
  all_css = all_css.concat(css_files[_all_css[f]]);
}

module.exports.all_css = all_css;

