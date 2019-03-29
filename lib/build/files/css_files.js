var css_files;
module.exports = css_files = {
  cdb: [
    '<%=  editor_assets_dir %>/stylesheets/map/leaflet.css',
    '<%=  editor_assets_dir %>/stylesheets/vendor/cartodb.css'
  ],

  old_common: [
    '<%=  editor_assets_dir %>/stylesheets/old_common/**/*.css',
    '<%=  editor_assets_dir %>/stylesheets/old_elements/**/*.css',
    '<%=  editor_assets_dir %>/stylesheets/plugins/**/*.css',
    '!<%=  editor_assets_dir %>/stylesheets/old_common/upload.css'
  ],

  old_common_without_core: [
    '<%=  editor_assets_dir %>/stylesheets/old_common/**/*.css',
    '<%=  editor_assets_dir %>/stylesheets/old_elements/**/*.css',
    '<%=  editor_assets_dir %>/stylesheets/plugins/**/*.css',
    // Core is replaced by a retrofitted set of styles, to make the old core styles work with new_common/default
    '!<%=  editor_assets_dir %>/stylesheets/old_common/core.css',
    '!<%=  editor_assets_dir %>/stylesheets/old_common/upload.css'
  ],

  common: [
    '<%=  editor_assets_dir %>/stylesheets/old_common/video_player.css',
    '<%=  editor_assets_dir %>/stylesheets/common/utilities.css',
    '<%=  editor_assets_dir %>/stylesheets/common/icon-font-specials.css',
    '<%=  editor_assets_dir %>/stylesheets/common/**/*.css',
    '<%=  editor_assets_dir %>/stylesheets/cartoassets/entry.css',
    '<%=  editor_assets_dir %>/stylesheets/client/**/*.css'
  ],

  password_protected: [
    '<%=  editor_assets_dir %>/stylesheets/public/password_protected.css',
    '<%=  editor_assets_dir %>/stylesheets/cartoassets/entry.css'
  ],

  public_dashboard: [
    '<%=  editor_assets_dir %>/stylesheets/public_dashboard/**/*.css',
    '<%=  editor_assets_dir %>/stylesheets/public_map/public_map_buttons.css',
    '<%=  editor_assets_dir %>/stylesheets/public_map/public_map_footer.css',
    '<%=  editor_assets_dir %>/stylesheets/cartoassets/entry.css'
  ],

  public_table: [
    '<%=  editor_assets_dir %>/stylesheets/table/table.css',
    '<%=  editor_assets_dir %>/stylesheets/old_elements/modal.css',
    '<%=  editor_assets_dir %>/stylesheets/old_elements/dialog_small_edit.css',
    '<%=  editor_assets_dir %>/stylesheets/old_elements/dropdown.css',
    '<%=  editor_assets_dir %>/stylesheets/public/public_map_wrapper.css',
    '<%=  editor_assets_dir %>/stylesheets/public/public_table_wrapper.css',
    '<%=  editor_assets_dir %>/stylesheets/public/public_map_data.css',
    '<%=  editor_assets_dir %>/stylesheets/public/public_map_body.css',
    '<%=  editor_assets_dir %>/stylesheets/public/public_map_info.css',
    '<%=  editor_assets_dir %>/stylesheets/public/public_export.css',
    '<%=  editor_assets_dir %>/stylesheets/public_table/**/*.css',
    '<%=  editor_assets_dir %>/stylesheets/public/public_map_fullscreen.css',
    '<%=  editor_assets_dir %>/stylesheets/map/**/*.css',
    '<%=  editor_assets_dir %>/stylesheets/cartoassets/entry.css'
  ],

  public_map: [
    '<%=  editor_assets_dir %>/stylesheets/public_map/**/*.css',
    '<%=  editor_assets_dir %>/stylesheets/cartoassets/entry.css'
  ],

  embed_map: [
    '<%=  editor_assets_dir %>/stylesheets/embed/**/*.css'
  ],

  explore: [
    '<%=  editor_assets_dir %>/stylesheets/explore/**/*.css',
    '<%=  editor_assets_dir %>/stylesheets/public_map/public_map_buttons.css',
    '<%=  editor_assets_dir %>/stylesheets/public_map/public_map_footer.css',
    '<%=  editor_assets_dir %>/stylesheets/cartoassets/entry.css'
  ],

  user_feed: [
    '<%=  editor_assets_dir %>/stylesheets/user_feed/**/*.css'
  ],

  leaflet: [
    '<%=  editor_assets_dir %>/stylesheets/map/leaflet.css'
  ],

  map: [
    '<%=  editor_assets_dir %>/stylesheets/map/**/*.css'
  ],

  cartodb: [
    '<%=  editor_assets_dir %>/stylesheets/vendor/cartodb.css'
  ],

  table: [
    '<%=  editor_assets_dir %>/stylesheets/vendor/codemirror.css',
    '<%=  editor_assets_dir %>/stylesheets/vendor/show-hint.css',
    '<%=  editor_assets_dir %>/stylesheets/vendor/cartodb.css',
    '<%=  editor_assets_dir %>/stylesheets/table/**/*.css'
  ],

  editor: [
    '<%=  editor_assets_dir %>/stylesheets/editor/core_retrofit.css',

    // From table bundle
    '<%=  editor_assets_dir %>/stylesheets/vendor/codemirror.css',
    '<%=  editor_assets_dir %>/stylesheets/vendor/show-hint.css',
    '<%=  editor_assets_dir %>/stylesheets/table/**/*.css',

    // New styles
    '<%=  editor_assets_dir %>/stylesheets/dashboard/delete-items.css',

    // Overrides for older styles, to work as expected with new_common/default
    '<%=  editor_assets_dir %>/stylesheets/editor/**/*.css'
  ],

  front: [
    '<%=  editor_assets_dir %>/stylesheets/front/*.css'
  ],

  deep_insights: [
    '<%=  editor_assets_dir %>/stylesheets/deep-insights/entry.css',
    '<%=  editor_assets_dir %>/stylesheets/cartodbjs_v4/entry.css'
  ],

  api_keys: [
    '<%=  editor_assets_dir %>/stylesheets/api_keys/*.css'
  ]
};

var _all_css = [];

var all_css = [];
for (var f in _all_css) {
  all_css = all_css.concat(css_files[_all_css[f]]);
}

module.exports.all_css = all_css;
