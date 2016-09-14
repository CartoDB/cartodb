var _ = require('underscore');
var LegendModelBase = require('./legend-model-base');

var STATE_LOADING = 'loading';
var STATE_SUCCESS = 'success';
var STATE_ERROR = 'error';

var DynamicLegendModelBase = LegendModelBase.extend({

  defaults: function () {
    return _.extend({
      state: STATE_LOADING
    }, LegendModelBase.prototype.defaults.apply(this));
  },

  isLoading: function () {
    return this.get('state') === STATE_LOADING;
  },

  isError: function () {
    return this.get('state') === STATE_ERROR;
  },

  isSuccess: function () {
    return this.get('state') === STATE_SUCCESS;
  },

  hasData: function () {
    throw new Error('subclasses of DynamicLegendModelBase must implement hasData');
  }
});

module.exports = DynamicLegendModelBase;
