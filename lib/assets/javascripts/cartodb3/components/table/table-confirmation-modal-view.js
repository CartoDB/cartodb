var CoreView = require('backbone/core-view');
var _ = require('underscore');
var renderLoading = require('../loading/render-loading');
var REQUIRED_OPTS = [
  'template',
  'runAction',
  'renderOpts',
  'loadingTitle',
  'modalModel'
];

/**
 *  Remove table column dialog
 *
 *  - To be rendered in a modal.
 */
module.exports = CoreView.extend({
  className: 'Dialog-content',

  events: {
    'click .js-delete': '_onOkClick',
    'click .js-cancel': '_onCancelClick'
  },

  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (!opts[item]) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(
      this._template(this._renderOpts)
    );
    return this;
  },

  _renderLoadingView: function () {
    this.$el.html(
      renderLoading({
        title: this._loadingTitle
      })
    );
  },

  _$content: function () {
    return this.$('.js-content');
  },

  _onOkClick: function () {
    this._renderLoadingView();
    this.options.runAction && this.options.runAction();
  },

  _onCancelClick: function () {
    this._modalModel.destroy();
  }

});
