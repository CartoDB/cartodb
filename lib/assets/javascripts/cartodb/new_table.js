// Not a unique entry file, but dependencies required for old table.js bundle, to retrofit newer browserify files to be
// usable in a non-browserified bundle
//
// Expected to be loaded after cdb.js but before table.js
cdb.admin.DeleteItemsView      = require('./new_dashboard/dialogs/delete_items_view');
cdb.admin.DeleteItemsViewModel = require('./new_dashboard/dialogs/delete_items_view_model');
