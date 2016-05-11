// Not a unique entry file, but dependencies required for old table.js bundle, to retrofit newer browserify files to be
// usable in a non-browserified bundle
//
// Expected to be loaded after cdb.js but before table.js
var cdb = require('cartodb.js-v3');
cdb.editor = {
  CreateVisFirstView: require('./common/dialogs/create_vis_first/create_vis_first_view'),
  ImportsCollection: require('./common/background_polling/models/imports_collection'),
  GeocodingModel: require('./common/background_polling/models/geocoding_model'),
  LonLatGeocodingModel: require('./common/background_polling/models/lon_lat_geocoding_model'),
  BackgroundPollingModel: require('./editor/background_polling_model'),
  ImagePickerView: require('./common/dialogs/map/image_picker_view'),
  BackgroundPollingView: require('./common/background_polling/background_polling_view'),
  AddLayerView: require('./common/dialogs/map/add_layer_view'),
  SyncView: require('./common/dialogs/sync_dataset/sync_dataset_view'),
  ScratchView: require('./common/dialogs/map/scratch_view'),
  AddLayerModel: require('./common/dialogs/map/add_layer_model'),
  FeatureDataView: require('./common/dialogs/feature_data/feature_data_dialog_view'),

  ChangePrivacyView: require('./common/dialogs/change_privacy/change_privacy_view'),
  EditVisMetadataView: require('./common/dialogs/edit_vis_metadata/edit_vis_metadata_dialog_view'),

  DeleteItemsView: require('./common/dialogs/delete_items_view'),
  DeleteItemsViewModel: require('./common/dialogs/delete_items_view_model'),
  DeleteLayerView: require('./common/dialogs/delete_layer/delete_layer_view'),
  DeleteColumnView: require('./common/dialogs/delete_column/delete_column_view'),
  DeleteRowView: require('./common/dialogs/delete_row/delete_row_view'),

  ExportImageResultView: require('./common/dialogs/static_image/export_image_result_view'),

  AdvancedExportView: require('./common/dialogs/static_image/advanced_export_view'),

  PublishView: require('./common/dialogs/publish/publish_view'),

  ChangeLockViewModel: require('./common/dialogs/change_lock/change_lock_view_model'),
  ChangeLockView: require('./common/dialogs/change_lock/change_lock_view'),

  PecanView: require('./common/dialogs/pecan/pecan_view'),

  DuplicateVisView: require('./common/dialogs/duplicate_vis_view'),
  DuplicateDatasetView: require('./common/dialogs/duplicate_dataset_view'),

  ExportView: require('./common/dialogs/export/export_view'),

  MergeDatasetsView: require('./common/dialogs/merge_datasets/merge_datasets_view'),
  GeoreferenceView: require('./common/dialogs/georeference/georeference_view'),

  LimitsReachView: require('./common/dialogs/limits_reach/limits_reached_view'),

  MamufasImportView: require('./common/mamufas_import/mamufas_import_view'),

  AddCustomBasemapView: require('./common/dialogs/add_custom_basemap/add_custom_basemap_view'),
  ViewFactory: require('./common/view_factory'),
  randomQuote: require('./common/view_helpers/random_quote.js'),

  ExportMapView: require('./common/dialogs/export_map/export_map_view')
};
