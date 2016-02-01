var cdb = require('cartodb.js-v3');
var _ = require('underscore-cdb-v3');

/**
 * View model for a share view modal.
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    vis: undefined,
    permission: undefined,
    organization: undefined
  },

  initialize: function(attrs) {
    if (!attrs.vis) throw new Error('vis is required');
    if (!attrs.organization) throw new Error('organization is required');

    var vis = this.get('vis');
    this.set('permission', vis.permission.clone());

    if (!vis.isVisualization()) {
      var self = this;
      vis.tableMetadata().fetch({
        silent: true,
        success: function() {
          self.trigger('all');
        }
      });
    }
  },

  name: function() {
    return this.get('vis').get('name');
  },

  isWriteAccessTogglerAvailable: function() {
    return !this.get('vis').isVisualization();
  }

});
