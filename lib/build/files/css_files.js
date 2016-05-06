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
    '<%= assets_dir %>/stylesheets/common/**/*.css'
  ],

  dashboard: [
    '<%= assets_dir %>/stylesheets/dashboard/*.css',
    '<%= assets_dir %>/stylesheets/video_tutorial/*.css',
    '<%= assets_dir %>/stylesheets/dashboard/datasets/*.css',
    '<%= assets_dir %>/stylesheets/dashboard/maps/*.css',
    '<%= assets_dir %>/stylesheets/cartoassets/**/*.css'
  ],

  password_protected: [
    '<%= assets_dir %>/stylesheets/public/password_protected.css'
  ],

  public_dashboard: [
    '<%= assets_dir %>/stylesheets/public_dashboard/**/*.css',
    '<%= assets_dir %>/stylesheets/public_map/public_map_buttons.css',
    '<%= assets_dir %>/stylesheets/public_map/public_map_footer.css'
  ],

  data_library: [
    '<%= assets_dir %>/stylesheets/fonts/proximanova-font-face.css',
    '<%= assets_dir %>/stylesheets/data_library/**/*.css',
    '<%= assets_dir %>/stylesheets/public_map/public_map_buttons.css',
    '<%= assets_dir %>/stylesheets/public_map/public_map_footer.css'
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
    '<%= assets_dir %>/stylesheets/map/**/*.css'
  ],

  public_map: [
    '<%= assets_dir %>/stylesheets/public_map/**/*.css'
  ],

  explore: [
    '<%= assets_dir %>/stylesheets/explore/**/*.css',
    '<%= assets_dir %>/stylesheets/public_map/public_map_buttons.css',
    '<%= assets_dir %>/stylesheets/public_map/public_map_footer.css'
  ],

  user_feed: [
    '<%= assets_dir %>/stylesheets/user_feed/**/*.css'
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

  editor3: [
    '<%= assets_dir %>/stylesheets/common/buttons.css',
    '<%= assets_dir %>/stylesheets/common/create/create_footer.css',
    '<%= assets_dir %>/stylesheets/common/create/create_header.css',
    '<%= assets_dir %>/stylesheets/common/icons/layout-icon.css',
    '<%= assets_dir %>/stylesheets/common/error-details.css',
    '<%= assets_dir %>/stylesheets/common/default.css',
    '<%= assets_dir %>/stylesheets/common/dialog.css',
    '<%= assets_dir %>/stylesheets/common/default-paragraph.css',
    '<%= assets_dir %>/stylesheets/common/default-description.css',
    '<%= assets_dir %>/stylesheets/common/default-title.css',
    '<%= assets_dir %>/stylesheets/common/default-time.css',
    '<%= assets_dir %>/stylesheets/common/default-time-diff.css',
    '<%= assets_dir %>/stylesheets/common/default-tags.css',
    '<%= assets_dir %>/stylesheets/common/rows-indicator.css',
    '<%= assets_dir %>/stylesheets/common/size-indicator.css',
    '<%= assets_dir %>/stylesheets/common/privacy-indicator.css',
    '<%= assets_dir %>/stylesheets/common/no-results.css',
    '<%= assets_dir %>/stylesheets/common/likes-indicator.css',
    '<%= assets_dir %>/stylesheets/common/filters.css',
    '<%= assets_dir %>/stylesheets/common/intermediate-info.css',
    '<%= assets_dir %>/stylesheets/common/nav-button.css',
    '<%= assets_dir %>/stylesheets/common/spinner.css',
    '<%= assets_dir %>/stylesheets/common/tabs.css',
    '<%= assets_dir %>/stylesheets/common/titles.css',
    '<%= assets_dir %>/stylesheets/common/utilities.css',
    '<%= assets_dir %>/stylesheets/vendor/tipsy.css',
    '<%= assets_dir %>/stylesheets/common/pagination.css',
    '<%= assets_dir %>/stylesheets/common/datepicker.css',
    '<%= assets_dir %>/stylesheets/common/datasets-list.css',
    '<%= assets_dir %>/stylesheets/common/create/**/*.css',
    '<%= assets_dir %>/stylesheets/common/form-content.css',
    '<%= assets_dir %>/stylesheets/common/forms/**/*.css',
    '<%= assets_dir %>/stylesheets/cartoassets/**/*.css',
    '<%= assets_dir %>/stylesheets/editor-3/**/*.css'
  ],

  public_editor3: [
    '<%= assets_dir %>/stylesheets/cartoassets/**/*.css'
  ],

  sessions: [
    '<%= assets_dir %>/stylesheets/common/flash-message.css',
    '<%= assets_dir %>/stylesheets/common/tooltip.css',
    '<%= assets_dir %>/stylesheets/common/logo.css',
    '<%= assets_dir %>/stylesheets/common/cdb-icon-font.css',
    '<%= assets_dir %>/stylesheets/fonts/proximanova-font-face.css',
    '<%= assets_dir %>/stylesheets/sessions/*.css'
  ],

  cartod1b: [
    '<%= assets_dir %>/stylesheets/vendor/cartod1b/cartod1b.css'
  ],

  front: [
    '<%= assets_dir %>/stylesheets/front/*.css'
  ],

  fonts: [
    '<%= assets_dir %>/stylesheets/fonts/lato-font-face.css'
  ],

  fonts_ie: [
    '<%= assets_dir %>/stylesheets/fonts_ie/*.css'
  ],

  deep_insights: [
    '<%= assets_dir %>/stylesheets/deep-insights/entry.css',
    '<%= assets_dir %>/stylesheets/deep-insights/main.css',
    '<%= assets_dir %>/stylesheets/cartodbjs_v4/entry.css'
  ]

};


var _all_css = [];

var all_css = [];
for(var f in _all_css){
  all_css = all_css.concat(css_files[_all_css[f]]);
}

module.exports.all_css = all_css;
