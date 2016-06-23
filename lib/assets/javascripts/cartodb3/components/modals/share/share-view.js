var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');

/**
 * View to add new widgets.
 * Expected to be rendered in a modal.
 */
module.exports = CoreView.extend({
  className: 'Dialog-content Dialog-content--expanded',

  events: {
    'click .js-continue': '_onContinue'
  },

  initialize: function (opts) {
    if (!opts.modalModel) throw new Error('modalModel is required');
    this._modalModel = opts.modalModel;
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    return this;
  },

  _onContinue: function () {
    this._modalModel.destroy();
  }
});
