var css_files;
module.exports = css_files = {
  cdb: [
    '<%= assets_dir %>/stylesheets/map/leaflet.css',
    '<%= assets_dir %>/stylesheets/vendor/cartodb.css'
  ],

  old_common: [
    '<%= assets_dir %>/stylesheets/old_common/**/*.css',
    '<%= assets_dir %>/stylesheets/old_elements/**/*.css',
    '<%= assets_dir %>/stylesheets/plugins/**/*.css',
    '!<%= assets_dir %>/stylesheets/old_common/upload.css'
  ],

  old_common_without_core: [
    '<%= assets_dir %>/stylesheets/old_common/**/*.css',
    '<%= assets_dir %>/stylesheets/old_elements/**/*.css',
    '<%= assets_dir %>/stylesheets/plugins/**/*.css',
    // Core is replaced by a retrofitted set of styles, to make the old core styles work with new_common/default
    '!<%= assets_dir %>/stylesheets/old_common/core.css',
    '!<%= assets_dir %>/stylesheets/old_common/upload.css'
  ],

  common: [
    '<%= assets_dir %>/stylesheets/old_common/video_player.css',
    '<%= assets_dir %>/stylesheets/common/utilities.css',
    '<%= assets_dir %>/stylesheets/common/icon-font-specials.css',
    '<%= assets_dir %>/stylesheets/common/**/*.css',
    '<%= assets_dir %>/stylesheets/cartoassets/entry.css',
    '<%= assets_dir %>/stylesheets/client/**/*.css'
  ],

  password_protected: [
    '<%= assets_dir %>/stylesheets/public/password_protected.css',
    '<%= assets_dir %>/stylesheets/cartoassets/entry.css'
  ],

  public_dashboard: [
    '<%= assets_dir %>/stylesheets/public_dashboard/**/*.css',
    '<%= assets_dir %>/stylesheets/public_map/public_map_buttons.css',
    '<%= assets_dir %>/stylesheets/public_map/public_map_footer.css',
    '<%= assets_dir %>/stylesheets/cartoassets/entry.css'
  ],

  public_table: [
    '<%= assets_dir %>/stylesheets/table/table.css',
    '<%= assets_dir %>/stylesheets/old_elements/modal.css',
    '<%= assets_dir %>/stylesheets/old_elements/dialog_small_edit.css',
    '<%= assets_dir %>/stylesheets/old_elements/dropdown.css',
    '<%= assets_dir %>/stylesheets/public/public_map_wrapper.css',
    '<%= assets_dir %>/stylesheets/public/public_table_wrapper.css',
    '<%= assets_dir %>/stylesheets/public/public_map_data.css',
    '<%= assets_dir %>/stylesheets/public/public_map_body.css',
    '<%= assets_dir %>/stylesheets/public/public_map_info.css',
    '<%= assets_dir %>/stylesheets/public/public_export.css',
    '<%= assets_dir %>/stylesheets/public_table/**/*.css',
    '<%= assets_dir %>/stylesheets/public/public_map_fullscreen.css',
    '<%= assets_dir %>/stylesheets/map/**/*.css',
    '<%= assets_dir %>/stylesheets/cartoassets/entry.css'
  ],

  public_map: [
    '<%= assets_dir %>/stylesheets/public_map/**/*.css',
    '<%= assets_dir %>/stylesheets/cartoassets/entry.css'
  ],

  embed_map: [
    '<%= assets_dir %>/stylesheets/embed/**/*.css'
  ],

  explore: [
    '<%= assets_dir %>/stylesheets/explore/**/*.css',
    '<%= assets_dir %>/stylesheets/public_map/public_map_buttons.css',
    '<%= assets_dir %>/stylesheets/public_map/public_map_footer.css',
    '<%= assets_dir %>/stylesheets/cartoassets/entry.css'
  ],

  user_feed: [
    '<%= assets_dir %>/stylesheets/user_feed/**/*.css'
  ],

  leaflet: [
    '<%= assets_dir %>/stylesheets/map/leaflet.css'
  ],

  map: [
    '<%= assets_dir %>/stylesheets/map/**/*.css'
  ],

  cartodb: [
    '<%= assets_dir %>/stylesheets/vendor/cartodb.css'
  ],

  table: [
    '<%= assets_dir %>/stylesheets/vendor/codemirror.css',
    '<%= assets_dir %>/stylesheets/vendor/show-hint.css',
    '<%= assets_dir %>/stylesheets/vendor/cartodb.css',
    '<%= assets_dir %>/stylesheets/table/**/*.css'
  ],

  editor: [
    '<%= assets_dir %>/stylesheets/editor/core_retrofit.css',

    // From table bundle
    '<%= assets_dir %>/stylesheets/vendor/codemirror.css',
    '<%= assets_dir %>/stylesheets/vendor/show-hint.css',
    '<%= assets_dir %>/stylesheets/table/**/*.css',

    // New styles
    '<%= assets_dir %>/stylesheets/dashboard/delete-items.css',

    // Overrides for older styles, to work as expected with new_common/default
    '<%= assets_dir %>/stylesheets/editor/**/*.css'
  ],

  front: [
    '<%= assets_dir %>/stylesheets/front/*.css'
  ],

  deep_insights: [
    '<%= assets_dir %>/stylesheets/deep-insights/entry.css',
    '<%= assets_dir %>/stylesheets/cartodbjs_v4/entry.css'
  ],

  api_keys: [
    '<%= assets_dir %>/stylesheets/api_keys/*.css'
  ]
};

var _all_css = [];

var all_css = [];
for (var f in _all_css) {
  all_css = all_css.concat(css_files[_all_css[f]]);
}

module.exports.all_css = all_css;
