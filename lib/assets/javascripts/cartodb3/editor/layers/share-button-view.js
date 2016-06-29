var CoreView = require('backbone/core-view');
var template = require('./share-button.tpl');

module.exports = CoreView.extend({

  events: {
    'click .js-button': '_clickHandler'
  },

  initialize: function (opts) {
    if (!opts.onClickAction) throw new Error('onClickAction is required');

    this._onClickAction = opts.onClickAction;
  },

  render: function () {
    this.clearSubViews();
    this.$el.append(template());
    return this;
  },

  _clickHandler: function () {
    this._onClickAction && this._onClickAction();
  }
});
