var CoreView = require('backbone/core-view');
var $ = require('jquery');
var _ = require('underscore');
var renderLoading = require('builder/components/loading/render-loading');
var ENTER_KEY_CODE = 13;
var REQUIRED_OPTS = [
  'template',
  'runAction',
  'modalModel'
];

/**
 *  Confirmation modal dialog
 */

module.exports = CoreView.extend({
  className: 'Dialog-content',

  events: {
    'click .js-confirm': '_onConfirm',
    'click .js-cancel': '_onCancel'
  },

  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (!opts[item]) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);

    if (opts.loadingTitle) {
      this._hasLoading = true;
      this._loadingTitle = opts.loadingTitle;
    }

    if (opts.renderOpts) {
      this._hasRenderOpts = true;
      this._renderOpts = opts.renderOpts;
    }

    this._onKeyDown = this._onKeyDown.bind(this);
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();

    var html = this._hasRenderOpts ? this._template(this._renderOpts) : this._template();
    this.$el.html(html);

    return this;
  },

  _initBinds: function () {
    $(document).bind('keydown', this._onKeyDown);
  },

  _disableBinds: function () {
    $(document).unbind('keydown', this._onKeyDown);
  },

  _onKeyDown: function (ev) {
    var keyCode = ev.which;
    if (keyCode === ENTER_KEY_CODE) {
      this._onConfirm();
    }
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

  _onConfirm: function () {
    if (this._hasLoading) {
      this._renderLoadingView();
    } else {
      this._modalModel.destroy();
    }

    this._runAction();
  },

  _onCancel: function () {
    this._modalModel.destroy();
  },

  clean: function () {
    this._disableBinds();
    CoreView.prototype.clean.apply(this);
  }

});
