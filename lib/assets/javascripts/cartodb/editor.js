// Not a unique entry file, but dependencies required for old table.js bundle, to retrofit newer browserify files to be
// usable in a non-browserified bundle
//
// Expected to be loaded after cdb.js but before table.js
var cdb = require('cartodb.js');
cdb.editor = {
  AddLayerView: require('./new_common/dialogs/map/add_layer_view'),
  AddLayerModel: require('./new_common/dialogs/map/add_layer_model'),
  DeleteItemsView: require('./new_common/dialogs/delete_items_view'),
  DeleteItemsViewModel: require('./new_common/dialogs/delete_items_view_model'),
  BackgroundImporter: require('./new_dashboard/background_importer/background_importer_view')
}
