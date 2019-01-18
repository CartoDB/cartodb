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

  initialize: function (models, opts) {
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.configModel) throw new Error('configModel is required');

    this._userModel = opts.userModel;
    this._configModel = opts.configModel;
  },

  model: function (attrs, opts) {
    return new ImportsModel(attrs, {
      userModel: opts.collection._userModel,
      configModel: opts.collection._configModel
    });
  },

  url: function (method) {
    var version = this._configModel.urlVersion('import');
    var baseUrl = this._configModel.get('base_url');
    return baseUrl + '/api/' + version + '/imports';
  },

  parse: function (r) {
    var self = this;

    if (r.imports.length === 0) {
      this.destroyCheck();
    } else {
      _.each(r.imports, function (id) {
        // Check if that import exists...
        var imports = self.filter(function (mdl) {
          return mdl._importModel.get('item_queue_id') === id;
        });

        if (imports.length === 0) {
          var importsModel = new ImportsModel({
            id: id
          }, {
            userModel: self._userModel,
            configModel: self._configModel
          });

          self.add(importsModel);
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
