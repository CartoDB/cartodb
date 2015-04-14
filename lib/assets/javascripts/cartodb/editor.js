var $ = require('jquery');
var cdb = require('cartodb.js');
var AddLayerView = require('./new_common/dialogs/map/add_layer_view');
var AddLayerModel = require('./new_common/dialogs/map/add_layer_model');

// Not a unique entry file, but dependencies required for old table.js bundle, to retrofit newer browserify files to be
// usable in a non-browserified bundle
//
// Expected to be loaded after cdb.js but before table.js
cdb.admin.DeleteItemsView      = require('./new_common/dialogs/delete_items_view');
cdb.admin.DeleteItemsViewModel = require('./new_common/dialogs/delete_items_view_model');

$(function() {
  cdb.init(function() {

    /**
     * @param {Object} opts where keys are:
     *   user: {cdb.admin.User}
     *   addVisLayer: {Function} taking two args: {cdb.admin.Visualization} and {cdb.core.View}
     */
    cdb.god.bind('openAddLayerDialog', function(opts) {
      var model = new AddLayerModel({}, {
        vis: opts.vis,
        map: opts.map,
        user: opts.user
      });
      var dialog = new AddLayerView({
        model: model,
        user: opts.user
      });
      dialog.appendToBody();
    });
  });

});
