var cdb = require('cartodb.js');
var template = require('./widget-error-template.tpl');

/**
 * Default widget error view:
 *
 * It will listen or not to dataviewModel changes when first load is done.
 */
module.exports = cdb.core.View.extend({
  className: 'CDB-Widget-error is-hidden',

  events: {
    'click .js-refresh': '_onRefreshClick'
  },

  initialize: function () {
    this._initBinds();
  },

  render: function () {
    this.$el.html(template());
    return this;
  },

  _initBinds: function () {
    this.model.bind('error', function (mdl, err) {
      if (!err || (err && err.statusText !== 'abort')) {
        this.show();
      }
    }, this);
    this.model.bind('loading loaded', this._onLoadStatusChanged, this);
  },

  _onRefreshClick: function () {
    this.model.refresh();
  },

  _onLoadStatusChanged: function () {
    this.model.has('error') ? this.show() : this.hide();
  },

  show: function () {
    this.$el.removeClass('is-hidden');
  },

  hide: function () {
    this.$el.addClass('is-hidden');
  }
});
