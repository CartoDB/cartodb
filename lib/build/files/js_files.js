var _ = require('underscore');

module.exports = files = {

  new_dashboard_deps: [
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
    'lib/assets/javascripts/cartodb/common/video_player.js',
    'lib/assets/javascripts/cartodb/common/dropdown_menu.js',
    'lib/assets/javascripts/cartodb/common/error_stats.js',
    'lib/assets/javascripts/cartodb/common/localStorage.js',
    'lib/assets/javascripts/cartodb/common/tipsy_tooltip.js',
    'lib/assets/javascripts/cartodb/common/utils.js',
    'lib/assets/javascripts/cartodb/common/mixpanel.js',
    'lib/assets/javascripts/cartodb/common/tabs.js',
    'lib/assets/javascripts/cartodb/common/urls/url.js',
    'lib/assets/javascripts/cartodb/common/urls/dashboard_vis_url.js',
    'lib/assets/javascripts/cartodb/common/urls/**/*.js'
  ],
  dashboard: [
    'vendor/assets/javascripts/d3.v2.js',
    'vendor/assets/javascripts/select2.min.js',
    'vendor/assets/javascripts/moment.js',
    'vendor/assets/javascripts/jquery-ui/**/*.js',
    'vendor/assets/javascripts/jquery.fileupload.js',
    'vendor/assets/javascripts/jquery.fileupload-fp.js',
    'vendor/assets/javascripts/jquery.fileupload-ui.js',
    'vendor/assets/javascripts/models.js',
    'vendor/assets/javascripts/markdown.js',
    'vendor/assets/javascripts/datepicker.js',
    'lib/assets/javascripts/cartodb/common/dropdown_menu.js',
    'lib/assets/javascripts/cartodb/common/dropdown_basemap.js',
    'lib/assets/javascripts/cartodb/common/forms/string_field.js',
    'lib/assets/javascripts/cartodb/common/forms/widgets.js',
    'lib/assets/javascripts/cartodb/common/import/import_pane.js',
    'lib/assets/javascripts/cartodb/common/import/import_url_pane.js',
    'lib/assets/javascripts/cartodb/common/import/import_info/import_info.js',
    'lib/assets/javascripts/cartodb/common/urls/url.js',
    'lib/assets/javascripts/cartodb/common/urls/dashboard_vis_url.js',
    'lib/assets/javascripts/cartodb/common/**/*.js',
    'lib/assets/javascripts/cartodb/dashboard/**/*.js',
    'lib/assets/javascripts/cartodb/dashboard/dashboard.js',
    'lib/assets/javascripts/cartodb/dashboard/views/**/*.js',
    'lib/assets/javascripts/cartodb/common/views/**/*.js',
    'lib/assets/javascripts/cartodb/common/export_table_dialog.js'
  ],

  sessions: [
  'vendor/assets/javascripts/jquery.min.js',
  'vendor/assets/javascripts/underscore.js',
  'vendor/assets/javascripts/backbone.js',
  'vendor/assets/javascripts/jquery.tipsy.js',
  'lib/assets/javascripts/cartodb/sessions/frontend.js',
  'lib/assets/javascripts/cartodb/sessions/sessions.js'
  ],

  application: [
  'vendor/assets/javascripts/jquery.tipsy.js',
  'vendor/assets/javascripts/rails.js'
  ],

  cdb: [
  'vendor/assets/javascripts/cartodb.uncompressed.js',
  'vendor/assets/javascripts/cartodb.mod.torque.uncompressed.js',
  'vendor/assets/javascripts/cartodb.mod.odyssey.uncompressed.js',
  'lib/assets/javascripts/cartodb/app.js',
  'lib/build/app_config.js'
  ],

  app: [
    'lib/assets/javascripts/cartodb/app.js',
    'lib/build/app_config.js'
  ],

  common_data: [
  'vendor/assets/javascripts/jquery-ui/**/*.js',
  'vendor/assets/javascripts/jquery.fileupload.js',
  'vendor/assets/javascripts/jquery.fileupload-fp.js',
  'vendor/assets/javascripts/jquery.fileupload-ui.js',
  'vendor/assets/javascripts/select2.min.js',
  'vendor/assets/javascripts/moment.js',
  'vendor/assets/javascripts/datepicker.js',
  'vendor/assets/javascripts/models.js',
  'vendor/assets/javascripts/markdown.js',
  'lib/assets/javascripts/cartodb/common/dropdown_menu.js',
  'lib/assets/javascripts/cartodb/common/user_settings_dropdown.js',
  'lib/assets/javascripts/cartodb/common/forms/string_field.js',
  'lib/assets/javascripts/cartodb/common/forms/widgets.js',
  'lib/assets/javascripts/cartodb/common/import/import_pane.js',
  'lib/assets/javascripts/cartodb/common/import/import_url_pane.js',
  'lib/assets/javascripts/cartodb/common/import/import_info/import_info.js',
  'lib/assets/javascripts/cartodb/common/urls/url.js',
  'lib/assets/javascripts/cartodb/common/urls/dashboard_vis_url.js',
  'lib/assets/javascripts/cartodb/common/**/*.js',
  'lib/assets/javascripts/cartodb/common_data/**/*.js',
  'lib/assets/javascripts/cartodb/common_data/common_data.js',
  'lib/assets/javascripts/cartodb/dashboard/views/**/*.js',
  'lib/assets/javascripts/cartodb/common/views/**/*.js'
  ],

  keys: [
  'vendor/assets/javascripts/ZeroClipboard.js',
  'vendor/assets/javascripts/models.js',
  'lib/assets/javascripts/cartodb/common/forms/string_field.js',
  'lib/assets/javascripts/cartodb/common/search_form.js',
  'lib/assets/javascripts/cartodb/common/dropdown_menu.js',
  'lib/assets/javascripts/cartodb/common/user_settings_dropdown.js',
  'lib/assets/javascripts/cartodb/common/error_stats.js',
  'lib/assets/javascripts/cartodb/keys/**/*.js',
  'lib/assets/javascripts/cartodb/common/view/**/*.js'
  ],

  new_keys_deps: [
    'vendor/assets/javascripts/jquery.tipsy.js',
    'vendor/assets/javascripts/rails.js',
    'vendor/assets/javascripts/ZeroClipboard.js',
    'lib/assets/javascripts/cartodb/common/dropdown_menu.js',
    'lib/assets/javascripts/cartodb/common/error_stats.js',
    'lib/assets/javascripts/cartodb/common/tipsy_tooltip.js',
    'lib/assets/javascripts/cartodb/common/utils.js',
    'lib/assets/javascripts/cartodb/common/mixpanel.js',
    'lib/assets/javascripts/cartodb/common/urls/url.js',
    'lib/assets/javascripts/cartodb/common/urls/dashboard_vis_url.js',
    'lib/assets/javascripts/cartodb/common/urls/**/*.js'
  ],

  account_deps: [
    'vendor/assets/javascripts/jquery.tipsy.js',
    'vendor/assets/javascripts/rails.js',
    'vendor/assets/javascripts/filestyle.js',
    'vendor/assets/javascripts/backbone-model-file-upload.js',
    'lib/assets/javascripts/cartodb/common/dropdown_menu.js',
    'lib/assets/javascripts/cartodb/common/error_stats.js',
    'lib/assets/javascripts/cartodb/common/tipsy_tooltip.js',
    'lib/assets/javascripts/cartodb/common/utils.js',
    'lib/assets/javascripts/cartodb/common/mixpanel.js',
    'lib/assets/javascripts/cartodb/common/urls/url.js',
    'lib/assets/javascripts/cartodb/common/urls/dashboard_vis_url.js',
    'lib/assets/javascripts/cartodb/common/urls/**/*.js'

  ],

  new_organization_deps: [
    'vendor/assets/javascripts/jquery.tipsy.js',
    'vendor/assets/javascripts/rails.js',
    'vendor/assets/javascripts/filestyle.js',
    'vendor/assets/javascripts/backbone-model-file-upload.js',
    'lib/assets/javascripts/cartodb/common/dropdown_menu.js',
    'lib/assets/javascripts/cartodb/common/error_stats.js',
    'lib/assets/javascripts/cartodb/common/tipsy_tooltip.js',
    'lib/assets/javascripts/cartodb/common/utils.js',
    'lib/assets/javascripts/cartodb/common/mixpanel.js',
    'lib/assets/javascripts/cartodb/common/urls/url.js',
    'lib/assets/javascripts/cartodb/common/urls/dashboard_vis_url.js',
    'lib/assets/javascripts/cartodb/common/urls/**/*.js'
  ],

  login: [
  'vendor/assets/javascripts/modernizr-min.js',
  'vendor/assets/javascripts/selectivizr-min.js',
  'lib/assets/javascripts/cartodb/app.js',
  'lib/assets/javascripts/cartodb/common/error_stats.js',
  'lib/assets/javascripts/cartodb/login/placeholder.js',
  'lib/assets/javascripts/cartodb/login/login.js'
  ],

  models: [
  'lib/assets/javascripts/cartodb/models/table.js',
  'lib/assets/javascripts/cartodb/models/tabledata.js',
  'lib/assets/javascripts/cartodb/models/sqlview.js',
  'lib/assets/javascripts/cartodb/models/cartodb_layer.js',
  'lib/assets/javascripts/cartodb/models/map.js',
  'lib/assets/javascripts/cartodb/models/user.js',
  'lib/assets/javascripts/cartodb/models/organization.js',
  'lib/assets/javascripts/cartodb/models/like.js',
  'lib/assets/javascripts/cartodb/models/carto/*.js',
  'lib/assets/javascripts/cartodb/models/**/*.js',
  'lib/assets/javascripts/cartodb/table/overlays/overlays.js'
  ],

  organization: [
  'lib/assets/javascripts/cartodb/common/forms/widgets.js',
  'lib/assets/javascripts/cartodb/common/dropdown_menu.js',
  'lib/assets/javascripts/cartodb/common/user_settings_dropdown.js',
  'lib/assets/javascripts/cartodb/common/base_dialog.js',
  'lib/assets/javascripts/cartodb/common/utils.js',
  'lib/assets/javascripts/cartodb/common/global_click.js',
  'lib/assets/javascripts/cartodb/common/error_stats.js',
  'lib/assets/javascripts/cartodb/common/views/rollbar.js',
  'lib/assets/javascripts/cartodb/common/views/settings_item.js',
  'lib/assets/javascripts/cartodb/common/views/confirm_dialog.js',
  'lib/assets/javascripts/cartodb/common/views/dialog_base.js',
  'vendor/assets/javascripts/filestyle.js',
  'lib/assets/javascripts/cartodb/organization/**/*.js'
  ],

  specs: [
  /*'test/lib/jasmine-1.3.1/jasmine.js',
  'test/lib/jasmine-1.3.1/jasmine-html.js',*/
    'lib/assets/test/spec/cartodb/**/*.js',

    // Test files that use browserify should be added in the tests bundle defined in lib/build/tasks/browserify.js
    '!lib/assets/test/spec/cartodb/new_*/**/*.js',
    '<%= browserify_modules.tests.dest %>'
  ],

  _spec_helpers: [
    //'lib/assets/test/lib/jasmine.jquery.js',
    'lib/assets/test/lib/sinon-1.3.4.js',
    'lib/assets/test/spec/SpecHelper.js'
  ],

  table: [
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
  'lib/assets/javascripts/utils/postgres.codemirror.js',
  'lib/assets/javascripts/utils/xml.codemirror.js',
  'lib/assets/javascripts/utils/draggable.js',
  'lib/assets/javascripts/utils/carto.codemirror.js',
  'lib/assets/javascripts/utils/color.keywords.js',
  'vendor/assets/javascripts/models.js',
  'lib/assets/javascripts/cartodb/common/dropdown_menu.js',
  'lib/assets/javascripts/cartodb/common/forms/string_field.js',
  'lib/assets/javascripts/cartodb/common/forms/widgets.js',
  'lib/assets/javascripts/cartodb/table/overlays/text.js',
  'lib/assets/javascripts/cartodb/common/import/import_pane.js',
  'lib/assets/javascripts/cartodb/common/import/import_url_pane.js',
  'lib/assets/javascripts/cartodb/common/import/import_info/import_info.js',
  'lib/assets/javascripts/cartodb/common/urls/url.js',
  'lib/assets/javascripts/cartodb/common/urls/dashboard_vis_url.js',
  'lib/assets/javascripts/cartodb/common/**/*.js',
  'lib/assets/javascripts/cartodb/table/right_menu.js',
  'lib/assets/javascripts/cartodb/table/default_layers.js',
  'lib/assets/javascripts/cartodb/table/menu_module.js',
  'lib/assets/javascripts/cartodb/table/menu_modules/carto_editor.js',
  'lib/assets/javascripts/cartodb/table/menu_modules/carto_wizard.js',
  'lib/assets/javascripts/cartodb/table/**/*.js',
  'lib/assets/javascripts/cartodb/table/table.js',
  'lib/assets/javascripts/cartodb/table/views/**/*.js',
  'lib/assets/javascripts/cartodb/dashboard/views/**/*.js'
  ],

  public_dashboard: [
    'vendor/assets/javascripts/jquery.tipsy.js',
    'lib/assets/javascripts/cartodb/models/like.js',
    'lib/assets/javascripts/cartodb/common/dropdown_menu.js',
    'lib/assets/javascripts/cartodb/public/**/*.js',
    'lib/assets/javascripts/cartodb/public_dashboard/*.js'
  ],

  new_public_dashboard_deps: [
    'lib/assets/javascripts/cartodb/public/authenticated_user.js',
    'lib/assets/javascripts/cartodb/models/cartodb_layer.js',
    'lib/assets/javascripts/cartodb/models/map.js',
    'lib/assets/javascripts/cartodb/models/user.js',
    'lib/assets/javascripts/cartodb/models/organization.js',
    'lib/assets/javascripts/cartodb/models/like.js',
    'lib/assets/javascripts/cartodb/common/dropdown_menu.js',
    'lib/assets/javascripts/cartodb/common/urls/url.js',
    'lib/assets/javascripts/cartodb/common/urls/dashboard_vis_url.js',
    'lib/assets/javascripts/cartodb/common/urls/**/*.js'

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
  'lib/assets/javascripts/cartodb/models/user.js',
  'lib/assets/javascripts/cartodb/models/permissions.js',
  'lib/assets/javascripts/cartodb/models/organization.js',
  'lib/assets/javascripts/cartodb/models/like.js',
  'lib/assets/javascripts/cartodb/models/synchronization.js',
  'lib/assets/javascripts/cartodb/models/wkt.js',
  'lib/assets/javascripts/cartodb/models/vis.js',

  // Tabpane from CDB.js :S
  'lib/assets/javascripts/cdb/src/ui/common/tabpane.js',

  // UI
  'lib/assets/javascripts/cartodb/common/dropdown_menu.js',
  'lib/assets/javascripts/cartodb/common/forms/string_field.js',
  'lib/assets/javascripts/cartodb/common/forms/widgets.js',
  'lib/assets/javascripts/cartodb/common/import/import_pane.js',
  'lib/assets/javascripts/cartodb/common/import/import_url_pane.js',
  'lib/assets/javascripts/cartodb/common/import/import_info/import_info.js',
  'lib/assets/javascripts/cartodb/common/urls/url.js',
  'lib/assets/javascripts/cartodb/common/urls/dashboard_vis_url.js',
  'lib/assets/javascripts/cartodb/common/**/*.js',
  'lib/assets/javascripts/cartodb/common/export_table_dialog.js',
  'lib/assets/javascripts/cartodb/table/editor_small_dialog.js',

  'lib/assets/javascripts/cartodb/table/header/duplicate_table_dialog.js',
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

  public_map: [
    'vendor/assets/javascripts/jquery.tipsy.js',
    'lib/assets/javascripts/cartodb/common/dropdown_menu.js',
    'lib/assets/javascripts/cartodb/common/base_dialog.js',
    'lib/assets/javascripts/cartodb/models/like.js',
    'lib/assets/javascripts/cartodb/table/header/duplicate_visualization_dialog.js',
    'lib/assets/javascripts/cartodb/public/**/*.js',
    'lib/assets/javascripts/cartodb/public_map/**/*.js'
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

  _new_dashboard_templates: [
    'lib/assets/javascripts/cartodb/new_common/**/*.jst.ejs',
    'lib/assets/javascripts/cartodb/new_dashboard/**/*.jst.ejs'
  ],

  _new_keys_templates: [
    'lib/assets/javascripts/cartodb/new_common/**/*.jst.ejs',
    'lib/assets/javascripts/cartodb/new_keys/**/*.jst.ejs'
  ],

  _new_organization_templates: [
    'lib/assets/javascripts/cartodb/new_common/**/*.jst.ejs',
    'lib/assets/javascripts/cartodb/new_organization/**/*.jst.ejs'
  ],

  _account_templates: [
    'lib/assets/javascripts/cartodb/new_common/**/*.jst.ejs',
    'lib/assets/javascripts/cartodb/account/**/*.jst.ejs'
  ],

  _templates_mustache: [
    'lib/assets/javascripts/cartodb/**/*.jst.mustache'
  ]

};


var _all = [
  'cdb',
  'app',
  'application',
  'models',
  'dashboard',
  'new_dashboard_deps',
  'new_keys_deps',
  'account_deps',
  'table',
  'common_data',
  'public_dashboard',
  'public_table',
  'public_map',
  'public_like',
  'tipsy',
  'modernizr',
  'statsc'
];

var all = [];
for(var f in _all){
  all = all.concat(files[_all[f]]);
}

module.exports.all = all;
