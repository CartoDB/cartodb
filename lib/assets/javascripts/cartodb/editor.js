// Not a unique entry file, but dependencies required for old table.js bundle, to retrofit newer browserify files to be
// usable in a non-browserified bundle
//
// Expected to be loaded after cdb.js but before table.js
var cdb = require('cartodb.js');
cdb.editor = {
  CreateVisFirstView: require('./common/dialogs/create_vis_first/create_vis_first_view'),
  ImportsCollection: require('./common/background_importer/imports_collection'),
  BackgroundImporterModel: require('./editor/background_importer_model'),
  ImagePickerView: require('./common/dialogs/map/image_picker_view'),
  BackgroundImporterView: require('./common/background_importer/background_importer_view'),
  AddLayerView: require('./common/dialogs/map/add_layer_view'),
  SyncView: require('./common/dialogs/map/sync_view'),
  ScratchView: require('./common/dialogs/map/scratch_view'),
  AddLayerModel: require('./common/dialogs/map/add_layer_model'),

  ChangePrivacyView: require('./common/dialogs/change_privacy/change_privacy_view'),

  DeleteItemsView: require('./common/dialogs/delete_items_view'),
  DeleteItemsViewModel: require('./common/dialogs/delete_items_view_model'),
  DeleteLayerView: require('./common/dialogs/delete_layer/delete_layer_view'),

  PublishView: require('./common/dialogs/publish/publish_view'),
  UrlShortener: require('./common/url_shortener'),

  ChangeLockViewModel: require('./common/dialogs/change_lock/change_lock_view_model'),
  ChangeLockView: require('./common/dialogs/change_lock/change_lock_view'),

  DuplicateVisView: require('./common/dialogs/duplicate_vis_view'),
  DuplicateDatasetView: require('./common/dialogs/duplicate_dataset_view'),

  ExportView: require('./common/dialogs/export/export_view'),

  AddCustomBasemapView: require('./common/dialogs/add_custom_basemap/add_custom_basemap_view'),
  ViewFactory: require('./common/view_factory'),
  randomQuote: require('./common/view_helpers/random_quote.js')
};
