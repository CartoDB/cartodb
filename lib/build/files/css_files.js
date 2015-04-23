var css_files;
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

  new_common: [
    '<%= assets_dir %>/stylesheets/common/video_player.css',
    '<%= assets_dir %>/stylesheets/new_common/utilities.css',
    '<%= assets_dir %>/stylesheets/new_common/icon-font.css',
    '<%= assets_dir %>/stylesheets/new_common/icon-font-specials.css',
    '<%= assets_dir %>/stylesheets/new_common/**/*.css'
  ],

  new_dashboard: [
    '<%= assets_dir %>/stylesheets/new_dashboard/*.css',
    '<%= assets_dir %>/stylesheets/new_dashboard/datasets/*.css',
    '<%= assets_dir %>/stylesheets/new_dashboard/maps/*.css'
  ],

  dashboard: [
    '<%= assets_dir %>/stylesheets/dashboard/**/*.css'
  ],

  common_data: [
    '<%= assets_dir %>/stylesheets/common_data/**/*.css'
  ],

  password_protected: [
    '<%= assets_dir %>/stylesheets/public/password_protected.css',
  ],

  public_dashboard: [
    '<%= assets_dir %>/stylesheets/common/**/*.css',
    '<%= assets_dir %>/stylesheets/elements/dropdown.css',
    '<%= assets_dir %>/stylesheets/public/public_header.css',
    '<%= assets_dir %>/stylesheets/public/public_footer.css',
    '<%= assets_dir %>/stylesheets/public/public_dropdown.css',
    '<%= assets_dir %>/stylesheets/public_dashboard/**/*.css'
  ],

  new_public_dashboard: [
    '<%= assets_dir %>/stylesheets/new_public_dashboard/**/*.css'
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

  new_keys: [
    '<%= assets_dir %>/stylesheets/new_keys/**/*.css'
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

  new_organization: [
    '<%= assets_dir %>/stylesheets/new_organization/*.css'
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
  ],

  editor: [
    // From common bundle, cannot reuse/change it since used in more places
    '<%= assets_dir %>/stylesheets/common/**/*.css',
    '<%= assets_dir %>/stylesheets/elements/**/*.css',
    '<%= assets_dir %>/stylesheets/plugins/**/*.css',

    // Core is replaced by a retrofitted set of styles, to make the old core styles work with new_common/default
    '!<%= assets_dir %>/stylesheets/common/core.css',
    '<%= assets_dir %>/stylesheets/editor/core_retrofit.css',

    // From table bundle
    '<%= assets_dir %>/stylesheets/vendor/codemirror.css',
    '<%= assets_dir %>/stylesheets/vendor/show-hint.css',
    '<%= assets_dir %>/stylesheets/table/**/*.css',

    // New styles
    '<%= assets_dir %>/stylesheets/new_dashboard/delete-items.css',

    // Overrides for older styles, to work as expected with new_common/default
    '<%= assets_dir %>/stylesheets/editor/table_overrides.css'
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
  'password_protected',
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
