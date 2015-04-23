var cdb = require('cartodb.js');

// Not a unique entry file, but dependencies required for old table.js bundle, to retrofit newer browserify files to be
// usable in a non-browserified bundle
//
// Expected to be loaded after cdb.js but before table.js
cdb.editor = {
  ChangePrivacyView: require('./new_common/dialogs/change_privacy/change_privacy_view'),
  ChangePrivacyModel: require('./new_common/dialogs/change_privacy/view_model'),
  DeleteItemsView: require('./new_common/dialogs/delete_items_view'),
  DeleteItemsViewModel: require('./new_common/dialogs/delete_items_view_model')
};
