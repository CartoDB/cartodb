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
    '<%= assets_dir %>/stylesheets/common/icon-font.css',
    '<%= assets_dir %>/stylesheets/common/icon-font-specials.css',
    '<%= assets_dir %>/stylesheets/common/**/*.css'
  ],

  dashboard: [
    '<%= assets_dir %>/stylesheets/dashboard/*.css',
    '<%= assets_dir %>/stylesheets/dashboard/datasets/*.css',
    '<%= assets_dir %>/stylesheets/dashboard/maps/*.css'
  ],

  password_protected: [
    '<%= assets_dir %>/stylesheets/public/password_protected.css'
  ],

  public_dashboard: [
    '<%= assets_dir %>/stylesheets/public_dashboard/**/*.css'
  ],

  public_data_dashboard: [
    '<%= assets_dir %>/stylesheets/public_data_dashboard/**/*.css'
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
  ],

  public_map: [
    '<%= assets_dir %>/stylesheets/public_map/**/*.css'
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
    '<%= assets_dir %>/stylesheets/plugins/tagit.css',
    '<%= assets_dir %>/stylesheets/old_elements/dropdown.css',
    '<%= assets_dir %>/stylesheets/old_elements/color_picker_dropdown.css',
    '<%= assets_dir %>/stylesheets/organization/*.css'
  ],

  cartodb: [
    '<%= assets_dir %>/stylesheets/vendor/cartodb.css',
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

  sessions: [
    '<%= assets_dir %>/stylesheets/common/tooltip.css',
    '<%= assets_dir %>/stylesheets/common/icon-font.css',
    '<%= assets_dir %>/stylesheets/common/logo.css',
    '<%= assets_dir %>/stylesheets/fonts/proximanova-font-face.css',
    '<%= assets_dir %>/stylesheets/sessions/*.css'
  ],

  front: [
    '<%= assets_dir %>/stylesheets/front/*.css'
  ],

  fonts: [
    '<%= assets_dir %>/stylesheets/fonts/lato-font-face.css'
  ],

  fonts_ie: [
    '<%= assets_dir %>/stylesheets/fonts_ie/*.css'
  ]

};


var _all_css = [];

var all_css = [];
for(var f in _all_css){
  all_css = all_css.concat(css_files[_all_css[f]]);
}

module.exports.all_css = all_css;
