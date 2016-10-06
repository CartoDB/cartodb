var Backbone = require('backbone');

var DataviewsChangeTracker = Backbone.Collection.extend({
  initialize: function (models, options) {
    this.vis = options.vis;
    this._tracking = false;

    this._initBinds();
  },

  _initBinds: function () {
    this.on('add', this._patch, this);
  },

  track: function () {
    this._tracking = true;
    this._check();
  },

  _patch: function (dataviewModel) {
    if (!dataviewModel.__patched) {
      dataviewModel.__patched = true;
      var _oldFetch = dataviewModel.fetch.bind(dataviewModel);

      dataviewModel.set('fetchStatus', 'unfetched');

      dataviewModel.fetch = function (options) {
        dataviewModel.set('fetchStatus', 'fetching');

        var newSuccess = function () {
          dataviewModel.set('fetchStatus', 'fetched');
          options && options.success && options.success();
        };

        var newError = function () {
          dataviewModel.set('fetchStatus', 'unavailable');
          options && options.error && options.error();
        };

        _oldFetch({
          success: newSuccess,
          error: newError
        });
      };

      dataviewModel.on('change:fetchStatus', this._check, this);
    }
  },

  _check: function () {
    if (!this._tracking) return;

    var allFetched = this.every(function (dataviewModel) {
      var status = dataviewModel.get('fetchStatus');
      return status === 'fetched' || status === 'unavailable';
    });

    if (allFetched) {
      this.vis.trigger('dataviewsFetched');
    }
  }
});

module.exports = DataviewsChangeTracker;
