var files = {
  cdb: [
    'vendor/assets/javascripts/cartodb.uncompressed.js',
    'vendor/assets/javascripts/cartodb.mod.torque.uncompressed.js',
    'lib/assets/javascripts/cartodb/config.js',
    'lib/assets/javascripts/cartodb/app.js',
    'lib/build/app_config.js'
  ],

  embed: [
    'vendor/assets/javascripts/cartodb.uncompressed.js',
    'vendor/assets/javascripts/cartodb.mod.torque.uncompressed.js',
    'lib/assets/javascripts/cartodb/config.js',
    'lib/assets/javascripts/cartodb/app.js'
  ],

  app: [
    'lib/assets/javascripts/cartodb/config.js',
    'lib/assets/javascripts/cartodb/app.js',
    'lib/build/app_config.js'
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
    'lib/assets/javascripts/cartodb/models/carto/*.js',
    'lib/assets/javascripts/cartodb/models/**/*.js',
    'lib/assets/javascripts/cartodb/table/overlays/overlays.js'
  ],

  specs: [
    'lib/assets/test/spec/cartodb/**/*.js',
    // Test files that use browserify should be added in the tests bundle defined in lib/build/tasks/browserify.js
    '!lib/assets/test/spec/cartodb/common/**/*.js',
    '!lib/assets/test/spec/cartodb/public_dashboard/**/*.js',
    '!lib/assets/test/spec/cartodb/keys/**/*.js',
    '!lib/assets/test/spec/cartodb/account/*.js',
    '!lib/assets/test/spec/cartodb/feed/**/*.js',
    '!lib/assets/test/spec/cartodb/explore/**/*.js',
    '!lib/assets/test/spec/cartodb/editor/**/*.js',
    '!lib/assets/test/spec/cartodb/public_map/**/*.spec.js',
    '!lib/assets/test/spec/cartodb/embed_map/**/*.spec.js',
    '!lib/assets/test/spec/cartodb/public/**/*.spec.js',
    '.grunt/browserify_modules_tests.js'
  ],

  _spec_helpers: [
    'node_modules/jasmine-ajax/lib/mock-ajax.js',
    'lib/assets/test/lib/sinon-1.3.4.js',
    'lib/assets/test/spec/SpecHelper.js'
  ],

  _spec_helpers3: [
    'lib/assets/test/spec/SpecHelper3.js'
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
    'lib/assets/javascripts/cartodb/table/menu_modules/wizards/torque.js',
    'lib/assets/javascripts/cartodb/table/**/*.js',
    'lib/assets/javascripts/cartodb/table/table.js',
    'lib/assets/javascripts/cartodb/table/views/**/*.js'
  ],

  public_dashboard_deps: [
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
    'lib/assets/javascripts/cartodb/old_common/dropdown_menu.js',
    'lib/assets/javascripts/cartodb/old_common/utils.js',
    'lib/assets/javascripts/cartodb/old_common/urls/url.js',
    'lib/assets/javascripts/cartodb/old_common/urls/dashboard_vis_url.js',
    'lib/assets/javascripts/cartodb/old_common/urls/**/*.js'
  ],

  public_map_deps: [
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
    'lib/assets/javascripts/cartodb/models/export_map_model.js',
    'lib/assets/javascripts/cartodb/old_common/dropdown_menu.js',
    'lib/assets/javascripts/cartodb/old_common/urls/url.js',
    'lib/assets/javascripts/cartodb/old_common/urls/dashboard_vis_url.js',
    'lib/assets/javascripts/cartodb/old_common/urls/**/*.js'
  ],

  user_feed_deps: [
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
    'lib/assets/javascripts/cartodb/old_common/utils.js',
    'lib/assets/javascripts/cartodb/old_common/dropdown_menu.js',
    'lib/assets/javascripts/cartodb/old_common/urls/url.js',
    'lib/assets/javascripts/cartodb/old_common/urls/dashboard_vis_url.js',
    'lib/assets/javascripts/cartodb/old_common/urls/**/*.js'
  ],

  statsc: [
    'vendor/assets/javascripts/statsc.min.js'
  ],

  _templates: [
    'lib/assets/javascripts/cartodb/**/*.jst.ejs'
  ],

  _public_templates: [
    'lib/assets/javascripts/cartodb/public/**/*.jst.ejs'
  ],

  _public_map_templates: [
    'lib/assets/javascripts/cartodb/common/**/*.jst.ejs',
    'lib/assets/javascripts/cartodb/public_map/**/*.jst.ejs'
  ],

  _templates_mustache: [
    'lib/assets/javascripts/cartodb/**/*.jst.mustache'
  ]
};

// Required by jasmine tests, so we can't
// remove it
var _all = [
  'cdb',
  'embed',
  'app',
  'models',
  'table',
  'public_dashboard_deps',
  'user_feed_deps',
  'statsc'
];

var all = [];
for (var f in _all) {
  all = all.concat(files[_all[f]]);
}

module.exports = files;
module.exports.all = all;
