var cdb = require('cartodb.js');

/**
 * Background importer model for the editor context.
 */
module.exports = cdb.core.Model.extend({

  initialize: function(attrs, opts) {
    this.user = opts.user;
    this.vis = opts.vis;
    this.collection = opts.collection;
    this.collection.bind('change:state', this._onImportsStateChange, this);
  },

  _onImportsStateChange: function(importsModel) {
    var self = this;
    if (importsModel.get('state') === 'complete') {
      this.vis.map.addCartodbLayerFromTable(importsModel.imp.get('table_name'), this.user.get('username'), {
        vis: this.vis,
        success: function() {
          // layers need to be saved because the order may changed
          self.vis.map.layers.saveLayers();
          self.collection.remove(importsModel);
        },
        error: function(err, forbidden) {
          console.warn('TODO: could not add new imported datset as layer, why? what to do');
        }
      });
    }
  }

});
