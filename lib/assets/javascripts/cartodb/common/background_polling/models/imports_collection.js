/* global cdb */
var Backbone = require('backbone-cdb-v3');
var _ = require('underscore-cdb-v3');
var pollTimer = 30000;
var ImportsModel = require('./imports_model');

/**
 *  Imports collection
 *
 *  If it is fetched, it will add the import
 *
 */

module.exports = Backbone.Collection.extend({

  model: ImportsModel,

  url: function (method) {
    var version = cdb.config.urlVersion('import', method);
    return '/api/' + version + '/imports';
  },

  initialize: function (mdls, opts) {
    this.user = opts.user;
  },

  parse: function (r) {
    var self = this;

    if (r.imports.length === 0) {
      this.destroyCheck();
    } else {
      _.each(r.imports, function (id) {

        // Check if that import exists...
        var imports = self.filter(function (mdl){ return mdl.imp.get('item_queue_id') === id });

        if (imports.length === 0) {
          self.add(new ImportsModel({ id: id }, { user: self.user } ));
        }
      });
    }

    return this.models
  },

  canImport: function () {
    var importQuota = this.user.getMaxConcurrentImports();
    var total = this.size();
    var finished = 0;

    this.each(function (m) {
      if (m.hasFailed() || m.hasCompleted()) {
        ++finished;
      }
    });

    return (total - finished) < importQuota;
  },

  pollCheck: function (i) {
    if (this.pollTimer) return;

    var self = this;
    this.pollTimer = setInterval(function () {
      self.fetch();
    }, pollTimer || 2000);

    // Start doing a fetch
    this.fetch();
  },

  destroyCheck: function () {
    clearInterval(this.pollTimer);
    delete this.pollTimer;
  },

  completedItems: function () {
    return this.filter(function (item) {
      return item.hasCompleted();
    });
  },

  getCompletedItemsCount: function () {
    return this.completedItems().length;
  },

  failedItems: function () {
    return this.filter(function (item) {
      return item.hasFailed();
    });
  },

  getFailedItemsCount: function () {
    return this.failedItems().length;
  },

  allImportsCompletedOrFailed: function () {
    return this.all(function (item) {
      return item.hasCompleted() ||
        item.hasFailed();
    });
  }
});
