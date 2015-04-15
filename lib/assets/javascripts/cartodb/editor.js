// Not a unique entry file, but dependencies required for old table.js bundle, to retrofit newer browserify files to be
// usable in a non-browserified bundle
//
// Expected to be loaded after cdb.js but before table.js
var cdb = require('cartodb.js');
cdb.admin.AddLayerView = require('./new_common/dialogs/map/add_layer_view');
cdb.admin.AddLayerModel = require('./new_common/dialogs/map/add_layer_model');
cdb.admin.DeleteItemsView = require('./new_common/dialogs/delete_items_view');
cdb.admin.DeleteItemsViewModel = require('./new_common/dialogs/delete_items_view_model');
cdb.admin.BackgroundImporter = require('./new_dashboard/background_importer/background_importer_view');
