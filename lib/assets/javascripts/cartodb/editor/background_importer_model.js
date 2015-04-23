var cdb = require('cartodb.js');

/**
 * Background importer model for the editor context.
 */
module.exports = cdb.core.Model.extend({

  initialize: function(attrs, opts) {
    this.user = opts.user;
    this.vis = opts.vis;
    this.importsCollection = opts.importsCollection;
    this.importsCollection.bind('change:state', this._onImportsStateChange, this);
  },

  _onImportsStateChange: function(importsModel) {
    if (importsModel.hasCompleted()) {
      var self = this;
      this.vis.map.addCartodbLayerFromTable(importsModel.imp.get('table_name'), this.user.get('username'), {
        vis: this.vis,
        success: function() {
          // layers need to be saved because the order may changed
          self.vis.map.layers.saveLayers();
          self.importsCollection.remove(importsModel);
        },
        error: function() {
          self.trigger('importLayerFail', 'Failed to add the connected dataset as a layer to this map');
          self.importsCollection.remove(importsModel);
        }
      });
    }
  }

});
