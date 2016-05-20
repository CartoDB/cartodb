var _ = require('underscore');

module.exports = files = {

  dashboard_deps: [
    'vendor/assets/javascripts/webfontloader.js',
    'vendor/assets/javascripts/d3.v2.js',
    'vendor/assets/javascripts/jquery.tipsy.js',
    'vendor/assets/javascripts/rails.js',
    'vendor/assets/javascripts/moment.js',
    'vendor/assets/javascripts/markdown.js',
    'vendor/assets/javascripts/backbone-model-file-upload.js',
    'vendor/assets/javascripts/datepicker.js',
    'vendor/assets/javascripts/jquery-ui/**/*.js',
    'vendor/assets/javascripts/dropzone.js',
    'vendor/assets/javascripts/dragster.js',
    'lib/assets/javascripts/cartodb/fonts/lato_loader.js',
    'lib/assets/javascripts/cartodb/old_common/video_player.js',
    'lib/assets/javascripts/cartodb/old_common/dropdown_menu.js',
    'lib/assets/javascripts/cartodb/old_common/error_stats.js',
    'lib/assets/javascripts/cartodb/old_common/localStorage.js',
    'lib/assets/javascripts/cartodb/old_common/tipsy_tooltip.js',
    'lib/assets/javascripts/cartodb/old_common/utils.js',
    'lib/assets/javascripts/cartodb/old_common/metrics.js',
    'lib/assets/javascripts/cartodb/old_common/tabs.js',
    'lib/assets/javascripts/cartodb/old_common/urls/url.js',
    'lib/assets/javascripts/cartodb/old_common/urls/dashboard_vis_url.js',
    'lib/assets/javascripts/cartodb/old_common/urls/**/*.js'
  ],

  sessions: [
    'vendor/assets/javascripts/jquery.tipsy.js',
    'lib/assets/javascripts/cartodb/sessions/sessions.js'
  ],

  signup: [
    'vendor/assets/javascripts/jquery.tipsy.js',
    'lib/assets/javascripts/cartodb/signup/entry.js'
  ],

  cdb: [
    'vendor/assets/javascripts/cartodb.uncompressed.js',
    'vendor/assets/javascripts/cartodb.mod.torque.uncompressed.js',
    'vendor/assets/javascripts/cartodb.mod.odyssey.uncompressed.js',
    'lib/assets/javascripts/cartodb/config.js',
    'lib/assets/javascripts/cartodb/app.js',
    'lib/build/app_config.js'
  ],

  embed: [
    'vendor/assets/javascripts/cartodb.uncompressed.js',
    'vendor/assets/javascripts/cartodb.mod.torque.uncompressed.js',
    'vendor/assets/javascripts/cartodb.mod.odyssey.uncompressed.js',
    'lib/assets/javascripts/cartodb/config.js',
    'lib/assets/javascripts/cartodb/app.js'
  ],

  app: [
    'lib/assets/javascripts/cartodb/config.js',
    'lib/assets/javascripts/cartodb/app.js',
    'lib/build/app_config.js'
  ],

  keys_deps: [
    'vendor/assets/javascripts/webfontloader.js',
    'vendor/assets/javascripts/jquery.tipsy.js',
    'vendor/assets/javascripts/rails.js',
    'vendor/assets/javascripts/ZeroClipboard.js',
    'vendor/assets/javascripts/moment.js',
    'lib/assets/javascripts/cartodb/fonts/lato_loader.js',
    'lib/assets/javascripts/cartodb/old_common/dropdown_menu.js',
    'lib/assets/javascripts/cartodb/old_common/error_stats.js',
    'lib/assets/javascripts/cartodb/old_common/tipsy_tooltip.js',
    'lib/assets/javascripts/cartodb/old_common/utils.js',
    'lib/assets/javascripts/cartodb/old_common/metrics.js',
    'lib/assets/javascripts/cartodb/old_common/urls/url.js',
    'lib/assets/javascripts/cartodb/old_common/urls/dashboard_vis_url.js',
    'lib/assets/javascripts/cartodb/old_common/urls/**/*.js'
  ],

  account_deps: [
    'vendor/assets/javascripts/webfontloader.js',
    'vendor/assets/javascripts/jquery.tipsy.js',
    'vendor/assets/javascripts/rails.js',
    'vendor/assets/javascripts/filestyle.js',
    'vendor/assets/javascripts/moment.js',
    'lib/assets/javascripts/cartodb/fonts/lato_loader.js',
    'vendor/assets/javascripts/backbone-model-file-upload.js',
    'lib/assets/javascripts/cartodb/old_common/dropdown_menu.js',
    'lib/assets/javascripts/cartodb/old_common/error_stats.js',
    'lib/assets/javascripts/cartodb/old_common/tipsy_tooltip.js',
    'lib/assets/javascripts/cartodb/old_common/utils.js',
    'lib/assets/javascripts/cartodb/old_common/metrics.js',
    'lib/assets/javascripts/cartodb/old_common/urls/url.js',
    'lib/assets/javascripts/cartodb/old_common/urls/dashboard_vis_url.js',
    'lib/assets/javascripts/cartodb/old_common/urls/**/*.js'
  ],

  organization_deps: [
    'vendor/assets/javascripts/webfontloader.js',
    'vendor/assets/javascripts/jquery.tipsy.js',
    'vendor/assets/javascripts/rails.js',
    'vendor/assets/javascripts/filestyle.js',
    'vendor/assets/javascripts/moment.js',
    'vendor/assets/javascripts/rgbcolor.js',
    'vendor/assets/javascripts/colorpicker.js',
    'vendor/assets/javascripts/jquery-ui/**/*.js',
    'vendor/assets/javascripts/tag-it.js',
    'lib/assets/javascripts/cartodb/fonts/lato_loader.js',
    'vendor/assets/javascripts/backbone-model-file-upload.js',
    'lib/assets/javascripts/cartodb/old_common/dropdown_menu.js',
    'lib/assets/javascripts/cartodb/old_common/error_stats.js',
    'lib/assets/javascripts/cartodb/old_common/tipsy_tooltip.js',
    'lib/assets/javascripts/cartodb/old_common/utils.js',
    'lib/assets/javascripts/cartodb/old_common/forms/color_picker.js',
    'lib/assets/javascripts/cartodb/old_common/metrics.js',
    'lib/assets/javascripts/cartodb/old_common/urls/url.js',
    'lib/assets/javascripts/cartodb/old_common/urls/dashboard_vis_url.js',
    'lib/assets/javascripts/cartodb/old_common/urls/**/*.js'
  ],

  models: [
    'lib/assets/javascripts/cartodb/models/table.js',
    'lib/assets/javascripts/cartodb/models/tabledata.js',
    'lib/assets/javascripts/cartodb/models/sqlview.js',
    'lib/assets/javascripts/cartodb/models/cartodb_layer.js',
    'lib/assets/javascripts/cartodb/models/map.js',
    'lib/assets/javascripts/cartodb/models/group.js',
    'lib/assets/javascripts/cartodb/models/user_groups.js',
    'lib/assets/javascripts/cartodb/models/organization_groups.js',
    'lib/assets/javascripts/cartodb/models/user.js',
    'lib/assets/javascripts/cartodb/models/permissions.js',
    'lib/assets/javascripts/cartodb/models/group_users.js',
    'lib/assets/javascripts/cartodb/models/grantable.js',
    'lib/assets/javascripts/cartodb/models/grantables.js',
    'lib/assets/javascripts/cartodb/models/organization.js',
    'lib/assets/javascripts/cartodb/models/like.js',
    'lib/assets/javascripts/cartodb/models/carto/*.js',
    'lib/assets/javascripts/cartodb/models/**/*.js',
    'lib/assets/javascripts/cartodb/table/overlays/overlays.js'
  ],

  specs: [
  /*'test/lib/jasmine-1.3.1/jasmine.js',
  'test/lib/jasmine-1.3.1/jasmine-html.js',*/
    'lib/assets/test/spec/cartodb/**/*.js',

    // Test files that use browserify should be added in the tests bundle defined in lib/build/tasks/browserify.js
    '!lib/assets/test/spec/cartodb/common/**/*.js',
    '!lib/assets/test/spec/cartodb/organization*/**/*.js',
    '!lib/assets/test/spec/cartodb/dashboard/**/*.js',
    '!lib/assets/test/spec/cartodb/public_dashboard/**/*.js',
    '!lib/assets/test/spec/cartodb/keys/**/*.js',
    '!lib/assets/test/spec/cartodb/account/**/*.js',
    '!lib/assets/test/spec/cartodb/data_library/**/*.js',
    '!lib/assets/test/spec/cartodb/feed/**/*.js',
    '!lib/assets/test/spec/cartodb/explore/**/*.js',
    '!lib/assets/test/spec/cartodb/editor/**/*.js',
    '.grunt/browserify_modules_tests.js'
  ],

  _spec_helpers: [
    //'lib/assets/test/lib/jasmine.jquery.js',
    'lib/assets/test/lib/sinon-1.3.4.js',
    'lib/assets/test/spec/SpecHelper.js'
  ],

  _spec_helpers3: [
    'lib/assets/test/spec/SpecHelper3.js'
  ],

  table: [
  'vendor/assets/javascripts/rails.js',
  'vendor/assets/javascripts/codemirror.js',
  'vendor/assets/javascripts/show-hint.js',
  'vendor/assets/javascripts/anyword-hint.js',
  'vendor/assets/javascripts/custom-list-hint.js',
  'vendor/assets/javascripts/custom-list-with-type-hint.js',
  'vendor/assets/javascripts/select2.min.js',
  'vendor/assets/javascripts/jquery.faviconNotify.js',
  'vendor/assets/javascripts/rgbcolor.js',
  'vendor/assets/javascripts/crossfilter.js',
  'vendor/assets/javascripts/jquery-ui/**/*.js',
  'vendor/assets/javascripts/jquery.caret.js',
  'vendor/assets/javascripts/moment.js',
  'vendor/assets/javascripts/ZeroClipboard.js',
  'vendor/assets/javascripts/tag-it.js',
  'vendor/assets/javascripts/jquery.tipsy.js',
  'vendor/assets/javascripts/d3.v2.js',
  'vendor/assets/javascripts/colorpicker.js',
  'vendor/assets/javascripts/jquery.fileupload.js',
  'vendor/assets/javascripts/jquery.fileupload-fp.js',
  'vendor/assets/javascripts/jquery.fileupload-ui.js',
  'vendor/assets/javascripts/leaflet.draw.js',
  'vendor/assets/javascripts/moment.js',
  'vendor/assets/javascripts/markdown.js',
  'vendor/assets/javascripts/datepicker.js',
  'vendor/assets/javascripts/dragster.js',
  'vendor/assets/javascripts/dropzone.js',
  'vendor/assets/javascripts/backbone-model-file-upload.js',
  'vendor/assets/javascripts/html2canvas.js',
  'lib/assets/javascripts/utils/postgres.codemirror.js',
  'lib/assets/javascripts/utils/xml.codemirror.js',
  'lib/assets/javascripts/utils/draggable.js',
  'lib/assets/javascripts/utils/carto.codemirror.js',
  'lib/assets/javascripts/utils/color.keywords.js',
  'vendor/assets/javascripts/models.js',
  'lib/assets/javascripts/cartodb/old_common/utils.js',
  'lib/assets/javascripts/cartodb/old_common/dropdown_menu.js',
  'lib/assets/javascripts/cartodb/old_common/forms/string_field.js',
  'lib/assets/javascripts/cartodb/old_common/forms/widgets.js',
  'lib/assets/javascripts/cartodb/table/overlays/text.js',
  'lib/assets/javascripts/cartodb/old_common/urls/url.js',
  'lib/assets/javascripts/cartodb/old_common/urls/dashboard_vis_url.js',
  'lib/assets/javascripts/cartodb/old_common/**/*.js',
  'lib/assets/javascripts/cartodb/table/right_menu.js',
  'lib/assets/javascripts/cartodb/table/default_layers.js',
  'lib/assets/javascripts/cartodb/table/menu_module.js',
  'lib/assets/javascripts/cartodb/table/menu_modules/carto_editor.js',
  'lib/assets/javascripts/cartodb/table/menu_modules/carto_wizard.js',
  'lib/assets/javascripts/cartodb/table/**/*.js',
  'lib/assets/javascripts/cartodb/table/table.js',
  'lib/assets/javascripts/cartodb/table/views/**/*.js'
  ],

  public_dashboard_deps: [
    'vendor/assets/javascripts/webfontloader.js',
    'vendor/assets/javascripts/moment.js',
    'lib/assets/javascripts/cartodb/public/authenticated_user.js',
    'lib/assets/javascripts/cartodb/models/cartodb_layer.js',
    'lib/assets/javascripts/cartodb/models/map.js',
    'lib/assets/javascripts/cartodb/models/group.js',
    'lib/assets/javascripts/cartodb/models/user_groups.js',
    'lib/assets/javascripts/cartodb/models/organization_groups.js',
    'lib/assets/javascripts/cartodb/models/user.js',
    'lib/assets/javascripts/cartodb/models/permissions.js',
    'lib/assets/javascripts/cartodb/models/group_users.js',
    'lib/assets/javascripts/cartodb/models/grantable.js',
    'lib/assets/javascripts/cartodb/models/grantables.js',
    'lib/assets/javascripts/cartodb/models/organization.js',
    'lib/assets/javascripts/cartodb/models/like.js',
    'lib/assets/javascripts/cartodb/fonts/lato_loader.js',
    'lib/assets/javascripts/cartodb/old_common/dropdown_menu.js',
    'lib/assets/javascripts/cartodb/old_common/utils.js',
    'lib/assets/javascripts/cartodb/old_common/urls/url.js',
    'lib/assets/javascripts/cartodb/old_common/urls/dashboard_vis_url.js',
    'lib/assets/javascripts/cartodb/old_common/urls/**/*.js'
  ],

  data_library_deps: [
    'vendor/assets/javascripts/webfontloader.js',
    'vendor/assets/javascripts/moment.js',
    'lib/assets/javascripts/cartodb/public/authenticated_user.js',
    'lib/assets/javascripts/cartodb/models/cartodb_layer.js',
    'lib/assets/javascripts/cartodb/models/map.js',
    'lib/assets/javascripts/cartodb/models/group.js',
    'lib/assets/javascripts/cartodb/models/user_groups.js',
    'lib/assets/javascripts/cartodb/models/organization_groups.js',
    'lib/assets/javascripts/cartodb/models/user.js',
    'lib/assets/javascripts/cartodb/models/permissions.js',
    'lib/assets/javascripts/cartodb/models/group_users.js',
    'lib/assets/javascripts/cartodb/models/grantable.js',
    'lib/assets/javascripts/cartodb/models/grantables.js',
    'lib/assets/javascripts/cartodb/models/filter.js',
    'lib/assets/javascripts/cartodb/models/organization.js',
    'lib/assets/javascripts/cartodb/models/vis.js',
    'lib/assets/javascripts/cartodb/fonts/lato_loader.js',
    'lib/assets/javascripts/cartodb/old_common/dropdown_menu.js',
    'lib/assets/javascripts/cartodb/old_common/utils.js',
    'lib/assets/javascripts/cartodb/old_common/urls/url.js',
    'lib/assets/javascripts/cartodb/old_common/urls/dashboard_vis_url.js',
    'lib/assets/javascripts/cartodb/old_common/urls/**/*.js'
  ],

  explore_deps: [
    'vendor/assets/javascripts/webfontloader.js',
    'vendor/assets/javascripts/moment.js',
    'vendor/assets/javascripts/markdown.js',
    'lib/assets/javascripts/cartodb/public/authenticated_user.js',
    'lib/assets/javascripts/cartodb/models/cartodb_layer.js',
    'lib/assets/javascripts/cartodb/models/map.js',
    'lib/assets/javascripts/cartodb/models/group.js',
    'lib/assets/javascripts/cartodb/models/user_groups.js',
    'lib/assets/javascripts/cartodb/models/organization_groups.js',
    'lib/assets/javascripts/cartodb/models/user.js',
    'lib/assets/javascripts/cartodb/models/permissions.js',
    'lib/assets/javascripts/cartodb/models/group_users.js',
    'lib/assets/javascripts/cartodb/models/grantable.js',
    'lib/assets/javascripts/cartodb/models/grantables.js',
    'lib/assets/javascripts/cartodb/models/organization.js',
    'lib/assets/javascripts/cartodb/models/like.js',
    'lib/assets/javascripts/cartodb/fonts/lato_loader.js',
    'lib/assets/javascripts/cartodb/old_common/dropdown_menu.js',
    'lib/assets/javascripts/cartodb/old_common/utils.js',
    'lib/assets/javascripts/cartodb/old_common/urls/url.js',
    'lib/assets/javascripts/cartodb/old_common/urls/dashboard_vis_url.js',
    'lib/assets/javascripts/cartodb/old_common/urls/**/*.js'
  ],

  user_feed_deps: [
    'vendor/assets/javascripts/webfontloader.js',
    'vendor/assets/javascripts/moment.js',
    'vendor/assets/javascripts/markdown.js',
    'lib/assets/javascripts/cartodb/public/authenticated_user.js',
    'lib/assets/javascripts/cartodb/models/cartodb_layer.js',
    'lib/assets/javascripts/cartodb/models/map.js',
    'lib/assets/javascripts/cartodb/models/group.js',
    'lib/assets/javascripts/cartodb/models/user_groups.js',
    'lib/assets/javascripts/cartodb/models/organization_groups.js',
    'lib/assets/javascripts/cartodb/models/user.js',
    'lib/assets/javascripts/cartodb/models/permissions.js',
    'lib/assets/javascripts/cartodb/models/group_users.js',
    'lib/assets/javascripts/cartodb/models/grantable.js',
    'lib/assets/javascripts/cartodb/models/grantables.js',
    'lib/assets/javascripts/cartodb/models/organization.js',
    'lib/assets/javascripts/cartodb/models/like.js',
    'lib/assets/javascripts/cartodb/fonts/lato_loader.js',
    'lib/assets/javascripts/cartodb/old_common/utils.js',
    'lib/assets/javascripts/cartodb/old_common/dropdown_menu.js',
    'lib/assets/javascripts/cartodb/old_common/urls/url.js',
    'lib/assets/javascripts/cartodb/old_common/urls/dashboard_vis_url.js',
    'lib/assets/javascripts/cartodb/old_common/urls/**/*.js'
  ],

  public_table: [
    // Vendor
    'vendor/assets/javascripts/modernizr-min.js',
    'vendor/assets/javascripts/jquery.tipsy.js',
    'vendor/assets/javascripts/select2.min.js',

    // Models
    'lib/assets/javascripts/cartodb/models/table.js',
    'lib/assets/javascripts/cartodb/models/tabledata.js',
    'lib/assets/javascripts/cartodb/models/sqlview.js',
    'lib/assets/javascripts/cartodb/models/cartodb_layer.js',
    'lib/assets/javascripts/cartodb/models/map.js',
    'lib/assets/javascripts/cartodb/models/group.js',
    'lib/assets/javascripts/cartodb/models/user_groups.js',
    'lib/assets/javascripts/cartodb/models/organization_groups.js',
    'lib/assets/javascripts/cartodb/models/user.js',
    'lib/assets/javascripts/cartodb/models/permissions.js',
    'lib/assets/javascripts/cartodb/models/group_users.js',
    'lib/assets/javascripts/cartodb/models/grantable.js',
    'lib/assets/javascripts/cartodb/models/grantables.js',
    'lib/assets/javascripts/cartodb/models/organization.js',
    'lib/assets/javascripts/cartodb/models/like.js',
    'lib/assets/javascripts/cartodb/models/synchronization.js',
    'lib/assets/javascripts/cartodb/models/wkt.js',
    'lib/assets/javascripts/cartodb/models/vis.js',

    // Tabpane from CDB.js :S
    'lib/assets/javascripts/cdb/src/ui/common/tabpane.js',

    // UI
    'lib/assets/javascripts/cartodb/old_common/dropdown_menu.js',
    'lib/assets/javascripts/cartodb/old_common/forms/string_field.js',
    'lib/assets/javascripts/cartodb/old_common/forms/widgets.js',
    'lib/assets/javascripts/cartodb/old_common/urls/url.js',
    'lib/assets/javascripts/cartodb/old_common/urls/dashboard_vis_url.js',
    'lib/assets/javascripts/cartodb/old_common/**/*.js',
    'lib/assets/javascripts/cartodb/table/editor_small_dialog.js',

    'lib/assets/javascripts/cartodb/table/infowindow.js',
    'lib/assets/javascripts/cartodb/table/tooltip.js',
    'lib/assets/javascripts/cartodb/table/row_view.js',
    'lib/assets/javascripts/cartodb/table/header_view.js',
    'lib/assets/javascripts/cartodb/table/tableview.js',
    'lib/assets/javascripts/cartodb/table/leaflet_monkeypatch.js',
    'lib/assets/javascripts/cartodb/table/mapview.js',
    'lib/assets/javascripts/cartodb/table/header_dropdown.js',

    // Public UI
    'lib/assets/javascripts/cartodb/public/**/*.js',
    'lib/assets/javascripts/cartodb/public_table/**/*.js',
    'lib/assets/javascripts/cartodb/public_table/public_table.js'
  ],

  public_map_deps: [
    'vendor/assets/javascripts/webfontloader.js',
    'lib/assets/javascripts/cartodb/public/authenticated_user.js',
    'lib/assets/javascripts/cartodb/models/cartodb_layer.js',
    'lib/assets/javascripts/cartodb/models/map.js',
    'lib/assets/javascripts/cartodb/models/group.js',
    'lib/assets/javascripts/cartodb/models/user_groups.js',
    'lib/assets/javascripts/cartodb/models/organization_groups.js',
    'lib/assets/javascripts/cartodb/models/user.js',
    'lib/assets/javascripts/cartodb/models/permissions.js',
    'lib/assets/javascripts/cartodb/models/group_users.js',
    'lib/assets/javascripts/cartodb/models/grantable.js',
    'lib/assets/javascripts/cartodb/models/grantables.js',
    'lib/assets/javascripts/cartodb/models/organization.js',
    'lib/assets/javascripts/cartodb/models/like.js',
    'lib/assets/javascripts/cartodb/models/export_map_model.js',
    'lib/assets/javascripts/cartodb/fonts/lato_loader.js',
    'lib/assets/javascripts/cartodb/old_common/dropdown_menu.js',
    'lib/assets/javascripts/cartodb/old_common/urls/url.js',
    'lib/assets/javascripts/cartodb/old_common/urls/dashboard_vis_url.js',
    'lib/assets/javascripts/cartodb/old_common/urls/**/*.js'
  ],

  cartod1b: [
    'vendor/assets/javascripts/cartod1b/cartod1b.uncompressed.js',
    'vendor/assets/javascripts/colorbrewer.js',
    'vendor/assets/javascripts/cartod1b/cartod1b.mod.torque.uncompressed.js',
    'vendor/assets/javascripts/cartod1b/torque-bi-layer.js',
    'vendor/assets/javascripts/cartod1b/cartocss.js',
    'vendor/assets/javascripts/cartod1b/filterableJson.js',
    'vendor/assets/javascripts/cartod1b/leaflet-hash.js',
    'vendor/assets/javascripts/cartod1b/renderer.js'
  ],

  public_like: [
    'lib/assets/javascripts/cartodb/models/like.js',
    'lib/assets/javascripts/cartodb/public/public_like.js'
  ],

  tipsy: [
    'vendor/assets/javascripts/jquery.tipsy.js'
  ],

  modernizr: [
    'vendor/assets/javascripts/modernizr-min.js'
  ],

  statsc: [
    'vendor/assets/javascripts/statsc.min.js'
  ],

  _templates: [
    'lib/assets/javascripts/cartodb/**/*.jst.ejs'
  ],

  _dashboard_templates: [
    'lib/assets/javascripts/cartodb/common/**/*.jst.ejs',
    'lib/assets/javascripts/cartodb/dashboard/**/*.jst.ejs'
  ],

  _keys_templates: [
    'lib/assets/javascripts/cartodb/common/**/*.jst.ejs',
    'lib/assets/javascripts/cartodb/keys/**/*.jst.ejs'
  ],

  _organization_templates: [
    'lib/assets/javascripts/cartodb/common/**/*.jst.ejs',
    'lib/assets/javascripts/cartodb/old_common/views/color_picker.jst.ejs',
    'lib/assets/javascripts/cartodb/organization*/**/*.jst.ejs',
    'lib/assets/javascripts/cartodb/keys/**/*.jst.ejs'
  ],

  _account_templates: [
    'lib/assets/javascripts/cartodb/common/**/*.jst.ejs',
    'lib/assets/javascripts/cartodb/account/**/*.jst.ejs'
  ],

  _confirmation_templates: [
    'lib/assets/javascripts/cartodb/confirmation/confirmation_info.jst.ejs'
  ],

  _templates_mustache: [
    'lib/assets/javascripts/cartodb/**/*.jst.mustache'
  ]

};


// Required by jasmine tests, so we can't
// remove it
var _all = [
  'cdb',
  'app',
  'models',
  'dashboard_deps',
  'keys_deps',
  'account_deps',
  'organization_deps',
  'explore_deps',
  'table',
  'public_dashboard_deps',
  'public_table',
  'public_map_deps',
  'public_like',
  'statsc'
];

var all = [];
for(var f in _all){
  all = all.concat(files[_all[f]]);
}

module.exports.all = all;
