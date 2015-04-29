// Not a unique entry file, but dependencies required for old table.js bundle, to retrofit newer browserify files to be
// usable in a non-browserified bundle
//
// Expected to be loaded after cdb.js but before table.js
var cdb = require('cartodb.js');
cdb.editor = {
  ImportsCollection: require('./new_common/background_importer/imports_collection'),
  BackgroundImporterModel: require('./editor/background_importer_model'),
  BackgroundImporterView: require('./new_common/background_importer/background_importer_view'),
  AddLayerView: require('./new_common/dialogs/map/add_layer_view'),
  AddLayerModel: require('./new_common/dialogs/map/add_layer_model'),

  ChangePrivacyView: require('./new_common/dialogs/change_privacy/change_privacy_view'),

  DeleteItemsView: require('./new_common/dialogs/delete_items_view'),
  DeleteItemsViewModel: require('./new_common/dialogs/delete_items_view_model'),

  PublishView: require('./new_common/dialogs/publish/publish_view'),
  UrlShortener: require('./new_common/url_shortener'),

  DuplicateVisView: require('./new_common/dialogs/duplicate_vis_view'),

  ViewFactory: require('./new_common/view_factory')
};
