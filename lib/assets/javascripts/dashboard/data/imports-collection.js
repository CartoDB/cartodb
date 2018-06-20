const _ = require('underscore');
const Backbone = require('backbone');
const ImportsModel = require('dashboard/data/imports-model');
const checkAndBuildOpts = require('builder/helpers/required-opts');
const pollTimer = 30000;

const REQUIRED_OPTS = [
  'configModel',
  'userModel'
];

/**
 *  Imports collection
 *
 *  If it is fetched, it will add the import
 *
 */

module.exports = Backbone.Collection.extend({

  model: function (attrs, options) {
    return new ImportsModel(attrs, {
      userModel: options.collection._userModel,
      configModel: options.collection._configModel
    });
  },

  url: function (method) {
    const version = this._configModel.urlVersion('import', method);
    return '/api/' + version + '/imports';
  },

  initialize: function (models, options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
  },

  parse: function (r) {
    if (r.imports.length === 0) {
      this.destroyCheck();
    } else {
      _.each(r.imports, id => {
        // Check if that import exists...
        var imports = this.filter(mdl => mdl._importModel.get('item_queue_id') === id);

        if (imports.length === 0) {
          this.add(new ImportsModel({ id: id }, {
            userModel: this._userModel,
            configModel: this._configModel
          }));
        }
      });
    }

    return this.models;
  },

  canImport: function () {
    const importQuota = this._userModel.getMaxConcurrentImports();
    const total = this.size();
    let finished = 0;

    this.each(function (m) {
      if (m.hasFailed() || m.hasCompleted()) {
        ++finished;
      }
    });

    return (total - finished) < importQuota;
  },

  pollCheck: function (i) {
    if (this.pollTimer) return;

    this.pollTimer = setInterval(() => {
      this.fetch();
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
