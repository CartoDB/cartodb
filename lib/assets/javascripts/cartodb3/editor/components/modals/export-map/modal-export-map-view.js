var CoreView = require('backbone/core-view');
var $ = require('jquery');
var _ = require('underscore');
var renderLoading = require('../../../../components/loading/render-loading.js');
var REQUIRED_OPTS = [
  'template',
  'modalModel',
  'renderOpts'
];

/**
 *  Remove confirmation dialog
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

    this._onKeyDown = this._onKeyDown.bind(this);
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(
      this._template(this._renderOpts)
    );
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
    if (keyCode === $.ui.keyCode.ENTER) {
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
    this.modalModel.requestExport();
  },

  _onCancel: function () {
    this._modalModel.abortExport();
  },

  clean: function () {
    this._disableBinds();
    CoreView.prototype.clean.apply(this);
  }
});
