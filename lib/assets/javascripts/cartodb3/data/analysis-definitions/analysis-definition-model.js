var _ = require('underscore');
var cdb = require('cartodb.js');

/**
 * Base model for an analysis model.
 * Expected to be extended
 */
module.exports = cdb.core.Model.extend({

  /**
   * @override {cdb.core.Model.prototype.sync} custom behavior for an update
   */
  sync: function (method, model, options) {
    if (method === 'update') {
      // Always send as a POST, and the URL w/o id (e.g. POST /viz/:viz_id/analyses { id 'a1', … })
      method = 'create';
      var customURL = this.url().replace('/' + this.id, '');
      options = _.defaults({ url: customURL }, options);
    }
    return cdb.core.Model.prototype.sync.call(this, method, model, options);
  }

});
