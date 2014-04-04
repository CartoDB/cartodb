var _ = require('underscore');

module.exports = files = {

  dashboard: [
    '../../vendor/assets/javascripts/d3.v2.js',
    '../../vendor/assets/javascripts/select2.min.js',
    '../../vendor/assets/javascripts/moment.js',
    '../../vendor/assets/javascripts/jquery-ui/**/*.js',
    '../../vendor/assets/javascripts/jquery.fileupload.js',
    '../../vendor/assets/javascripts/jquery.fileupload-fp.js',
    '../../vendor/assets/javascripts/jquery.fileupload-ui.js',
    '../../vendor/assets/javascripts/models.js',
    '../assets/javascripts/cartodb/common/dropdown_menu.js',
    '../assets/javascripts/cartodb/common/dropdown_basemap.js',
    '../assets/javascripts/cartodb/common/forms/string_field.js',
    '../assets/javascripts/cartodb/common/forms/widgets.js',
    '../assets/javascripts/cartodb/common/import/import_pane.js',
    '../assets/javascripts/cartodb/common/import/import_info/import_info.js',
    '../assets/javascripts/cartodb/common/**/*.js',
    '../assets/javascripts/cartodb/dashboard/**/*.js',
    '../assets/javascripts/cartodb/dashboard/dashboard.js',
    '../assets/javascripts/cartodb/dashboard/views/**/*.js',
    '../assets/javascripts/cartodb/common/views/**/*.js',
    '../assets/javascripts/cartodb/common/export_table_dialog.js',
  ],

  application: [
  '../../vendor/assets/javascripts/jquery.tipsy.js',
  '../../vendor/assets/javascripts/rails.js'
  ],

  cdb: [
  '../../vendor/assets/javascripts/cartodb.uncompressed.js',
  '../../vendor/assets/javascripts/cartodb.mod.torque.uncompressed.js',
  '../assets/javascripts/cartodb/app.js',
  'app_config.js'
  ],

  common_data: [
  '../../vendor/assets/javascripts/jquery-ui/**/*.js',
  '../../vendor/assets/javascripts/jquery.fileupload.js',
  '../../vendor/assets/javascripts/jquery.fileupload-fp.js',
  '../../vendor/assets/javascripts/jquery.fileupload-ui.js',
  '../../vendor/assets/javascripts/select2.min.js',
  '../../vendor/assets/javascripts/models.js',
  '../assets/javascripts/cartodb/common/dropdown_menu.js',
  '../assets/javascripts/cartodb/common/user_settings_dropdown.js',
  '../assets/javascripts/cartodb/common/forms/string_field.js',
  '../assets/javascripts/cartodb/common/forms/widgets.js',
  '../assets/javascripts/cartodb/common/import/import_pane.js',
  '../assets/javascripts/cartodb/common/import/import_info/import_info.js',
  '../assets/javascripts/cartodb/common/**/*.js',
  '../assets/javascripts/cartodb/common_data/**/*.js',
  '../assets/javascripts/cartodb/common_data/common_data.js',
  '../assets/javascripts/cartodb/dashboard/views/**/*.js',
  '../assets/javascripts/cartodb/common/views/**/*.js'
  ],

  keys: [
  '../../vendor/assets/javascripts/ZeroClipboard.js',
  '../../vendor/assets/javascripts/models.js',
  '../assets/javascripts/cartodb/common/forms/string_field.js',
  '../assets/javascripts/cartodb/common/search_form.js',
  '../assets/javascripts/cartodb/common/dropdown_menu.js',
  '../assets/javascripts/cartodb/common/user_settings_dropdown.js',
  '../assets/javascripts/cartodb/common/error_stats.js',
  '../assets/javascripts/cartodb/keys/**/*.js',
  '../assets/javascripts/cartodb/common/view/**/*.js'
  ],

  login: [
  '../../vendor/assets/javascripts/modernizr-min.js',
  '../../vendor/assets/javascripts/selectivizr-min.js',
  '../assets/javascripts/cartodb/app.js',
  '../assets/javascripts/cartodb/login/placeholder.js',
  '../assets/javascripts/cartodb/login/logi.js'
  ],

  models: [
  '../assets/javascripts/cartodb/models/table.js',
  '../assets/javascripts/cartodb/models/tabledata.js',
  '../assets/javascripts/cartodb/models/sqlview.js',
  '../assets/javascripts/cartodb/models/sqlview_api.js',
  '../assets/javascripts/cartodb/models/**/*.js'
  ],

  organization: [
  '../assets/javascripts/cartodb/common/forms/widgets.js',
  '../assets/javascripts/cartodb/common/dropdown_menu.js',
  '../assets/javascripts/cartodb/common/user_settings_dropdown.js',
  '../assets/javascripts/cartodb/common/base_dialog.js',
  '../assets/javascripts/cartodb/common/utils.js',
  '../assets/javascripts/cartodb/common/global_click.js',
  '../assets/javascripts/cartodb/common/error_stats.js',
  '../assets/javascripts/cartodb/common/views/rollbar.js',
  '../assets/javascripts/cartodb/common/views/settings_item.js',
  '../assets/javascripts/cartodb/common/views/confirm_dialog.js',
  '../assets/javascripts/cartodb/common/views/dialog_base.js',
  '../assets/javascripts/cartodb/organization/**/*.js'
  ],

  specs: [
  /*'test/lib/jasmine-1.3.1/jasmine.js',
  'test/lib/jasmine-1.3.1/jasmine-html.js',*/
  '../assets/test/spec/cartodb/**/*.js'
  ],

  _spec_helpers: [
    //'../assets/test/lib/jasmine.jquery.js',
    '../assets/test/lib/sinon-1.3.4.js',
    '../assets/test/spec/SpecHelper.js',
  ],

  table: [
  '../../vendor/assets/javascripts/codemirror.js',
  '../../vendor/assets/javascripts/show-hint.js',
  '../../vendor/assets/javascripts/anyword-hint.js',
  '../../vendor/assets/javascripts/custom-list-hint.js',
  '../../vendor/assets/javascripts/custom-list-with-type-hint.js',
  '../../vendor/assets/javascripts/select2.min.js',
  '../../vendor/assets/javascripts/jquery.faviconNotify.js',
  '../../vendor/assets/javascripts/rgbcolor.js',
  '../../vendor/assets/javascripts/crossfilter.js',
  '../../vendor/assets/javascripts/jquery-ui/**/*.js',
  '../../vendor/assets/javascripts/jquery.caret.js',
  '../../vendor/assets/javascripts/ZeroClipboard.js',
  '../../vendor/assets/javascripts/tag-it.js',
  '../../vendor/assets/javascripts/jquery.tipsy.js',
  '../../vendor/assets/javascripts/d3.v2.js',
  '../../vendor/assets/javascripts/colorpicker.js',
  '../../vendor/assets/javascripts/jquery.fileupload.js',
  '../../vendor/assets/javascripts/jquery.fileupload-fp.js',
  '../../vendor/assets/javascripts/jquery.fileupload-ui.js',
  '../../vendor/assets/javascripts/leaflet.draw.js',
  '../../vendor/assets/javascripts/moment.js',
  '../assets/javascripts/utils/postgres.codemirror.js',
  '../assets/javascripts/utils/carto.codemirror.js',
  '../assets/javascripts/utils/color.keywords.js',
  '../../vendor/assets/javascripts/models.js',
  '../assets/javascripts/cartodb/common/dropdown_menu.js',
  '../assets/javascripts/cartodb/common/forms/string_field.js',
  '../assets/javascripts/cartodb/common/forms/widgets.js',
  '../assets/javascripts/cartodb/common/import/import_pane.js',
  '../assets/javascripts/cartodb/common/import/import_info/import_info.js',
  '../assets/javascripts/cartodb/common/**/*.js',
  '../assets/javascripts/cartodb/table/right_menu.js',
  '../assets/javascripts/cartodb/table/menu_module.js',
  '../assets/javascripts/cartodb/table/menu_modules/carto_editor.js',
  '../assets/javascripts/cartodb/table/menu_modules/carto_wizard.js',
  '../assets/javascripts/cartodb/table/**/*.js',
  '../assets/javascripts/cartodb/table/table.js',
  '../assets/javascripts/cartodb/table/views/**/*.js',
  '../assets/javascripts/cartodb/dashboard/views/**/*.js'
  ],

  table_public: [
  '../../vendor/assets/javascripts/codemirror.js',
  '../../vendor/assets/javascripts/select2.min.js',
  '../../vendor/assets/javascripts/jquery.faviconNotify.js',
  '../../vendor/assets/javascripts/rgbcolor.js',
  '../../vendor/assets/javascripts/jquery-ui/**/*.js',
  '../../vendor/assets/javascripts/jquery.caret.js',
  '../../vendor/assets/javascripts/ZeroClipboard.js',
  '../../vendor/assets/javascripts/tag-it.js',
  '../../vendor/assets/javascripts/jquery.tipsy.js',
  '../assets/javascripts/utils/postgres.codemirror.js',
  '../assets/javascripts/utils/carto.codemirror.js',
  '../../vendor/assets/javascripts/models.js',
  '../assets/javascripts/cartodb/common/dropdown_menu.js',
  '../assets/javascripts/cartodb/common/forms/string_field.js',
  '../assets/javascripts/cartodb/common/forms/widgets.js',
  '../assets/javascripts/cartodb/common/import/import_pane.js',
  '../assets/javascripts/cartodb/common/import/import_info/import_info.js',
  '../assets/javascripts/cartodb/common/**/*.js',
  '../assets/javascripts/cartodb/common/export_table_dialog.js',
  '../assets/javascripts/cartodb/table/column_type_dropdown.js',
  '../assets/javascripts/cartodb/table/editor_small_dialog.js',
  '../assets/javascripts/cartodb/table/header_dropdown.js',
  '../assets/javascripts/cartodb/table/header_view.js',
  '../assets/javascripts/cartodb/table/infowindow.js',
  '../assets/javascripts/cartodb/table/row_view.js',
  '../assets/javascripts/cartodb/table/header_view.js',
  '../assets/javascripts/cartodb/table/tableview.js',
  '../assets/javascripts/cartodb/table/mapview.js',
  '../assets/javascripts/cartodb/table/views/**/*.js',
  '../assets/javascripts/cartodb/table_public/**/*.js',
  '../assets/javascripts/cartodb/table_public/table_public.js',
  // '../assets/javascripts/cartodb/table/views/**/*.js',
  // '../assets/javascripts/cartodb/dashboard/views/**/*.js',
  // '../assets/javascripts/cartodb/table_public/views/**/*.js'
  ],

  tipsy: [
    '../../vendor/assets/javascripts/jquery.tipsy.js'
  ],

  respond: [
    '../../vendor/assets/javascripts/respond.js'
  ],

  statsc: [
    '../../vendor/assets/javascripts/statsc.min.js'
  ],

  _templates: [
    '../assets/javascripts/cartodb/**/*.jst.ejs'
  ],

  _templates_mustache: [
    '../assets/javascripts/cartodb/**/*.jst.mustache'
  ]

};


var _all = [
  'cdb',
  'application',
  'models',
  'dashboard',
  'table',
  'common_data',
  'table_public',
  'tipsy',
  'respond',
  'statsc'
];
var all = [];
for(var f in _all){
  all = all.concat(files[_all[f]]);
}

module.exports.all = all;

