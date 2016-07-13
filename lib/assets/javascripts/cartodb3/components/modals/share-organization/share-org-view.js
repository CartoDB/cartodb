var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var template = require('./share-org.tpl');

module.exports = CoreView.extend({
  className: 'Dialog-content Dialog-content--expanded',

  events: {
    'click .js-cancel': '_onCancel',
    'click .js-back': '_onBack'
  },

  initialize: function (opts) {
    if (!opts.modalModel) throw new Error('modalModel is required');
    if (!opts.onBack) throw new TypeError('onBack is required');

    this._modalModel = opts.modalModel;
    this._onBack = opts.onBack;

    this._stateModel = new Backbone.Model({
      status: 'show'
    });
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());
  },

  _onCancel: function () {
    this._modalModel.destroy();
  },

  _onBack: function () {
    this._modalModel.destroy();
    this._onBack();
  }
});
