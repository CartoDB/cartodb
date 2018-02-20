var CoreView = require('backbone/core-view');
var $ = require('jquery');
var _ = require('underscore');
var renderLoading = require('builder/components/loading/render-loading.js');
var templateExportMapConfirmation = require('builder/editor/components/modals/export-map/export-map-confirmation.tpl');
var templateExportMapDownload = require('builder/editor/components/modals/export-map/export-map-download.tpl');
var ErrorView = require('builder/components/error/error-view.js');

var ENTER_KEY_CODE = 13;
var REQUIRED_OPTS = [
  'renderOpts',
  'modalModel',
  'exportMapModel'
];

module.exports = CoreView.extend({
  className: 'Dialog-content',

  events: {
    'click .js-confirm': '_onConfirm',
    'click .js-cancel': '_onCancel',
    'click .js-download': '_download'
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

    var state = this._exportMapModel.get('state');

    if (state === 'complete') {
      this._renderCompleteView();
    } else if (state === 'pending' || state === 'exporting' || state === 'uploading') {
      this._renderLoadingView(state);
    } else if (state === 'failure') {
      this._renderFailureView();
    } else {
      this._renderConfirmationView();
    }
  },

  _renderCompleteView: function () {
    var w = window.open(this._exportMapModel.get('url'));

    // If w is nullish, popup was blocked: we show a "click to download" modal. Else, download has started.
    if (w == null) {
      this.$el.html(templateExportMapDownload());
    } else {
      w.focus();
      this._modalModel.destroy();
    }
  },

  _renderLoadingView: function (state) {
    var loadingTitle = state.charAt(0).toUpperCase() + state.slice(1) + ' ...';

    this.$el.html(
      renderLoading({
        title: loadingTitle
      })
    );
  },

  _renderFailureView: function () {
    var errorView = new ErrorView({
      title: _t('editor.maps.export.error.title'),
      desc: _t('editor.maps.export.error.desc')
    });

    this.$el.html(errorView.render().el);
  },

  _renderConfirmationView: function () {
    this.$el.html(
      templateExportMapConfirmation({
        name: this._renderOpts.name
      })
    );
  },

  _initBinds: function () {
    $(document).bind('keydown', this._onKeyDown);

    this._exportMapModel.bind('change:state', function () {
      this.render();
    }, this);
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

  _onConfirm: function () {
    this._exportMapModel.requestExport();
  },

  _onCancel: function () {
    this._exportMapModel.cancelExport();

    this._modalModel.destroy();
  },

  _download: function () {
    window.open(this._exportMapModel.get('url'));
    window.focus();

    this._modalModel.destroy();
  },

  clean: function () {
    this._disableBinds();
    CoreView.prototype.clean.apply(this);
  }
});
