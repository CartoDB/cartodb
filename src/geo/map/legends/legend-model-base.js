var _ = require('underscore');
var Backbone = require('backbone');

var NON_RESETEABLE_DEFAULT_ATTRS = ['state', 'visible'];

var LegendModelBase = Backbone.Model.extend({
  defaults: function () {
    return {
      visible: false,
      title: '',
      preHTMLSnippet: '',
      postHTMLSnippet: '',
      state: this.constructor.STATE_LOADING
    };
  },

  initialize: function (attrs, deps) {
    if (!deps.visModel) throw new Error('visModel is required');

    deps.visModel.on('reload', this._onVisReloading, this);
  },

  _onVisReloading: function () {
    this.set('state', this.constructor.STATE_LOADING);
  },

  isLoading: function () {
    return this.get('state') === this.constructor.STATE_LOADING;
  },

  isError: function () {
    return this.get('state') === this.constructor.STATE_ERROR;
  },

  isSuccess: function () {
    return this.get('state') === this.constructor.STATE_SUCCESS;
  },

  show: function () {
    this.set('visible', true);
  },

  hide: function () {
    this.set('visible', false);
  },

  isVisible: function () {
    return this.get('visible');
  },

  update: function (attrs) {
    this.set(attrs);
  },

  getNonResettableAttrs: function () {
    return NON_RESETEABLE_DEFAULT_ATTRS;
  },

  reset: function () {
    var defaults = _.omit(this.defaults(),
      this.getNonResettableAttrs()
    );
    this.set(defaults);
  },

  isAvailable: function () {
    return false;
  }
}, {
  STATE_LOADING: 'loading',
  STATE_SUCCESS: 'success',
  STATE_ERROR: 'error'
});

module.exports = LegendModelBase;
