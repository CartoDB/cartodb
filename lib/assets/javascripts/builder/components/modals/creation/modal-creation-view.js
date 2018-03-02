var CoreView = require('backbone/core-view');
var _ = require('underscore');
var renderLoading = require('builder/components/loading/render-loading');
var ErrorView = require('builder/components/error/error-view');
var REQUIRED_OPTS = [
  'errorTitle',
  'loadingTitle',
  'runAction',
  'modalModel'
];

/**
 *  Remove confirmation dialog
 */
module.exports = CoreView.extend({
  className: 'Dialog-content',

  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (!opts[item]) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(
      renderLoading({
        title: this._loadingTitle
      })
    );
    this._runAction({
      error: this._renderErrorView.bind(this)
    });
    return this;
  },

  _renderErrorView: function (errorMessage) {
    var errorView = new ErrorView({
      title: this._errorTitle,
      desc: errorMessage
    });
    this.$el.html(errorView.render().el);
    this.addView(errorView);
  }

});
