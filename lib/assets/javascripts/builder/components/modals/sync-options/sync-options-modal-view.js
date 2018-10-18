var CoreView = require('backbone/core-view');
var template = require('./sync-options-modal.tpl');
var renderLoading = require('builder/components/loading/render-loading');
var ErrorView = require('builder/components/error/error-view');
var errorParser = require('builder/helpers/error-parser');

module.exports = CoreView.extend({
  className: 'Dialog-content',

  events: {
    'click .js-confirm': '_onConfirm',
    'click .js-cancel': '_onCancel'
  },

  initialize: function (opts) {
    if (!opts.modalModel) throw new Error('modalModel is required');
    if (!opts.syncModel) throw new Error('syncModel is required');
    if (!opts.tableName) throw new Error('tableName is required');

    this._syncModel = opts.syncModel;
    this._modalModel = opts.modalModel;
    this._tableName = opts.tableName;
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(
      template({
        interval: this._syncModel.get('interval'),
        service: this._syncModel.get('service_name') || '',
        isExternalSource: this._syncModel.get('from_external_source'),
        url: this._getServiceURL()
      })
    );
  },

  _renderErrorView: function (errorMessage) {
    var errorView = new ErrorView({
      title: _t('dataset.sync.error'),
      desc: errorMessage
    });
    this.$el.html(errorView.render().el);
    this.addView(errorView);
  },

  _renderLoadingView: function () {
    this.$el.html(
      renderLoading({
        title: _t('dataset.sync.loading', { tableName: this._tableName })
      })
    );
  },

  _getServiceURL: function () {
    if (this._syncModel.get('service_name') || this._syncModel.get('service_item_id')) {
      return this._syncModel.get('service_item_id');
    }
    return this._syncModel.get('url');
  },

  _onConfirm: function () {
    var interval = parseInt(this.$('[name="interval"]:checked').val(), 10);
    var opts = {
      wait: true,
      success: function () {
        this._modalModel.destroy();
      }.bind(this),
      error: function (mdl, e) {
        this._renderErrorView(errorParser(e));
      }.bind(this)
    };

    this._renderLoadingView();

    if (this._syncModel.get('interval') !== interval) {
      if (!interval) {
        this._syncModel.destroy(opts);
      } else {
        this._syncModel.save({
          interval: interval
        }, opts);
      }
    } else {
      this._modalModel.destroy();
    }
  },

  _onCancel: function () {
    this._modalModel.destroy();
  }

});
