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
    'javascripts/cartodb/common/dropdown_menu.js',
    'javascripts/cartodb/common/dropdown_basemap.js',
    'javascripts/cartodb/common/forms/string_field.js',
    'javascripts/cartodb/common/forms/widgets.js',
    'javascripts/cartodb/common/import/import_pane.js',
    'javascripts/cartodb/common/import/import_info/import_info.js',
    'javascripts/cartodb/common/**/*.js',
    'javascripts/cartodb/dashboard/**/*.js',
    'javascripts/cartodb/dashboard/dashboard.js',
    'javascripts/cartodb/dashboard/views/**/*.js',
    'javascripts/cartodb/common/views/**/*.js',
    'javascripts/cartodb/common/export_table_dialog.js',
  ],

  application: [
  '../../vendor/assets/javascripts/jquery.tipsy.js',
  '../../vendor/assets/javascripts/rails.js'
  ],

  cdb: [
  '../../vendor/assets/javascripts/cartodb.uncompressed.js',
  '../../vendor/assets/javascripts/cartodb.mod.torque.uncompressed.js',
  'javascripts/cartodb/app.js'
  ],

  common_data: [
  '../../vendor/assets/javascripts/jquery-ui/**/*.js',
  '../../vendor/assets/javascripts/jquery.fileupload.js',
  '../../vendor/assets/javascripts/jquery.fileupload-fp.js',
  '../../vendor/assets/javascripts/jquery.fileupload-ui.js',
  '../../vendor/assets/javascripts/select2.min.js',
  '../../vendor/assets/javascripts/models.js',
  'javascripts/cartodb/common/dropdown_menu.js',
  'javascripts/cartodb/common/user_settings_dropdown.js',
  'javascripts/cartodb/common/forms/string_field.js',
  'javascripts/cartodb/common/forms/widgets.js',
  'javascripts/cartodb/common/import/import_pane.js',
  'javascripts/cartodb/common/import/import_info/import_info.js',
  'javascripts/cartodb/common/**/*.js',
  'javascripts/cartodb/common_data/**/*.js',
  'javascripts/cartodb/common_data/common_data.js',
  'javascripts/cartodb/dashboard/views/**/*.js',
  'javascripts/cartodb/common/views/**/*.js'
  ],

  keys: [
  '../../vendor/assets/javascripts/ZeroClipboard.js',
  '../../vendor/assets/javascripts/models.js',
  'javascripts/cartodb/common/forms/string_field.js',
  'javascripts/cartodb/common/search_form.js',
  'javascripts/cartodb/common/dropdown_menu.js',
  'javascripts/cartodb/common/user_settings_dropdown.js',
  'javascripts/cartodb/keys/**/*.js',
  'javascripts/cartodb/common/view/**/*.js'
  ],

  login: [
  '../../vendor/assets/javascripts/modernizr-min.js',
  '../../vendor/assets/javascripts/selectivizr-min.js',
  'javascripts/cartodb/app.js',
  'javascripts/cartodb/login/placeholder.js',
  'javascripts/cartodb/login/logi.js'
  ],

  models: [
  'javascripts/cartodb/models/table.js',
  'javascripts/cartodb/models/tabledata.js',
  'javascripts/cartodb/models/sqlview.js',
  'javascripts/cartodb/models/sqlview_api.js',
  'javascripts/cartodb/models/**/*.js'
  ],

  organization: [
  '../../vendor/assets/javascripts/models.js',
  'javascripts/cartodb/common/forms/widgets.js',
  'javascripts/cartodb/common/dropdown_menu.js',
  'javascripts/cartodb/common/user_settings_dropdown.js',
  'javascripts/cartodb/common/base_dialog.js',
  'javascripts/cartodb/common/utils.js',
  'javascripts/cartodb/common/global_click.js',
  'javascripts/cartodb/common/views/settings_item.js',
  'javascripts/cartodb/common/views/confirm_dialog.js',
  'javascripts/cartodb/common/views/dialog_base.js',
  'javascripts/cartodb/organization/**/*.js',
  'javascripts/cartodb/organization/view/**/*.js'
  ],

  specs: [
  /*'test/lib/jasmine-1.3.1/jasmine.js',
  'test/lib/jasmine-1.3.1/jasmine-html.js',*/
  'test/spec/cartodb/**/*.js'
  ],

  _spec_helpers: [
    'test/lib/jasmine.jquery.js',
    'test/lib/sinon-1.3.4.js',
    'test/spec/SpecHelper.js',
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
  '../../vendor/assets/javascripts/jquery.fileupload.js',
  '../../vendor/assets/javascripts/jquery.fileupload-fp.js',
  '../../vendor/assets/javascripts/jquery.fileupload-ui.js',
  '../../vendor/assets/javascripts/leaflet.draw.js',
  '../../vendor/assets/javascripts/moment.js',
  'javascripts/utils/postgres.codemirror.js',
  'javascripts/utils/carto.codemirror.js',
  '../../vendor/assets/javascripts/models.js',
  'javascripts/cartodb/common/dropdown_menu.js',
  'javascripts/cartodb/common/forms/string_field.js',
  'javascripts/cartodb/common/forms/widgets.js',
  'javascripts/cartodb/common/import/import_pane.js',
  'javascripts/cartodb/common/import/import_info/import_info.js',
  'javascripts/cartodb/common/**/*.js',
  'javascripts/cartodb/table/right_menu.js',
  'javascripts/cartodb/table/menu_module.js',
  'javascripts/cartodb/table/menu_modules/carto_editor.js',
  'javascripts/cartodb/table/menu_modules/carto_wizard.js',
  'javascripts/cartodb/table/**/*.js',
  'javascripts/cartodb/table/table.js',
  'javascripts/cartodb/table/views/**/*.js',
  'javascripts/cartodb/dashboard/views/**/*.js'
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
  'javascripts/utils/postgres.codemirror.js',
  'javascripts/utils/carto.codemirror.js',
  '../../vendor/assets/javascripts/models.js',
  'javascripts/cartodb/common/dropdown_menu.js',
  'javascripts/cartodb/common/forms/string_field.js',
  'javascripts/cartodb/common/forms/widgets.js',
  'javascripts/cartodb/common/import/import_pane.js',
  'javascripts/cartodb/common/import/import_info/import_info.js',
  'javascripts/cartodb/common/**/*.js',
  'javascripts/cartodb/common/export_table_dialog.js',
  'javascripts/cartodb/table/column_type_dropdown.js',
  'javascripts/cartodb/table/editor_small_dialog.js',
  'javascripts/cartodb/table/header_dropdown.js',
  'javascripts/cartodb/table/header_view.js',
  'javascripts/cartodb/table/infowindow.js',
  'javascripts/cartodb/table/row_view.js',
  'javascripts/cartodb/table/header_view.js',
  'javascripts/cartodb/table/tableview.js',
  'javascripts/cartodb/table/mapview.js',
  'javascripts/cartodb/table/views/**/*.js',
  'javascripts/cartodb/table_public/**/*.js',
  'javascripts/cartodb/table_public/table_public.js',
  'javascripts/cartodb/table/views/**/*.js',
  'javascripts/cartodb/dashboard/views/**/*.js',
  'javascripts/cartodb/table_public/views/**/*.js'
  ],

  _templates: [
    'javascripts/cartodb/**/*.jst.ejs'
  ],
  _templates_mustache: [
    'javascripts/cartodb/**/*.jst.mustache'
  ]

};


var _all = [
  'cdb',
  'application',
  'models',
  'dashboard',
  'table',
  'common_data',
  'table_public'
];
var all = [];
for(var f in _all){
  all = all.concat(files[_all[f]]);
}

module.exports.all = all;

