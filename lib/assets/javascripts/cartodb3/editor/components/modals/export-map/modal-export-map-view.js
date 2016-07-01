var CoreView = require('backbone/core-view');
var $ = require('jquery');
var _ = require('underscore');
var renderLoading = require('../../../../components/loading/render-loading.js');
var templateExportMapConfirmation = require('../../../components/modals/export-map/export-map-confirmation.tpl');
var templateExportMapDownload = require('../../../components/modals/export-map/export-map-download.tpl');
var REQUIRED_OPTS = [
  'modalModel',
  'renderOpts',
  'exportMapModel'
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

    var state = this._exportMapModel.get('state');

    if (state === 'complete') {
      var w = window.open(this._exportMapModel.get('url'));

      // If w is undefined, popup was blocked: we show a "click to download" modal. Else, download has started.
      if (w === undefined) {
        this.$el.html(
          templateExportMapDownload
        );
        return;
      }

      w.focus();
      this._modalModel.destroy();
    } else if (state === 'failure') {
      return cdb.templates.getTemplate('common/templates/fail')({
        msg: 'Export has failed'
      });
    } else if (state === 'pending' || state === 'exporting' || state === 'uploading') {
      var loadingTitle = state.charAt(0).toUpperCase() + state.slice(1) + ' ...';

      renderLoading({
        title: loadingTitle
      });
    } else {
      this.$el.html(
        templateExportMapConfirmation({
          name: this._mapName
        })
      );
    }
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
    this._exportMapModel.requestExport();
  },

  _onCancel: function () {
    this._exportMapModel.cancelExport();

    this._modalModel.destroy();
  },

  clean: function () {
    this._disableBinds();
    CoreView.prototype.clean.apply(this);
  }
});
