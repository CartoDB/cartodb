var _ = require('underscore');
var Backbone = require('backbone');
var ImportsModel = require('./imports-model');
var POLL_TIMER = 30000;

/**
 *  Imports collection
 *
 *  If it is fetched, it will add the import
 *
 */

module.exports = Backbone.Collection.extend({

  model: ImportsModel,

  url: function (method) {
    // var version = cdb.config.urlVersion('import', method);
    var version = this._configModel.urlVersion('import'); // TODO: method?
    return '/api/' + version + '/imports';
  },

  initialize: function (models, opts) {
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.configModel) throw new Error('configModel is required');

    this._userModel = opts.userModel;
    this._configModel = opts.configModel;
  },

  parse: function (r) {
    var self = this;

    if (r.imports.length === 0) {
      this.destroyCheck();
    } else {
      _.each(r.imports, function (id) {
        // Check if that import exists...
        var imports = self.filter(function (mdl) { return mdl.imp.get('item_queue_id') === id; });

        if (imports.length === 0) {
          self.add(new ImportsModel({ id: id }, { user: self._userModel }));
        }
      });
    }

    return this.models;
  },

  canImport: function () {
    var importQuota = this._userModel.getMaxConcurrentImports();
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
    if (this.pollTimer) {
      return;
    }

    var self = this;

    this.pollTimer = setInterval(function () {
      self.fetch();
    }, POLL_TIMER || 2000);

    // Start doing a fetch
    this.fetch();
  },

  destroyCheck: function () {
    clearInterval(this.pollTimer);
    delete this.pollTimer;
  },

  failedItems: function () {
    return this.filter(function (item) {
      return item.hasFailed();
    });
  }
});
