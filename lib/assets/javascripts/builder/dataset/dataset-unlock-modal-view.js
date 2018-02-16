var CoreView = require('backbone/core-view');
var $ = require('jquery');
var _ = require('underscore');
var errorParser = require('builder/helpers/error-parser');
var template = require('./dataset-unlock-modal.tpl');
var renderLoading = require('builder/components/loading/render-loading');
var ErrorView = require('builder/components/error/error-view');

var REQUIRED_OPTS = [
  'tableName',
  'visModel',
  'configModel',
  'modalModel'
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
      template({
        tableName: this._tableName
      })
    );
    return this;
  },

  _initBinds: function () {
    $(document).bind('keydown', this._onKeyDown);

    this._modalModel.bind('change:show', function () {
      if (this._visModel.get('locked')) {
        this._onCancel();
      }
    }, this);
    this.add_related_model(this._modalModel);
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
        title: _t('dataset.unlock.loading', { tableName: this._tableName })
      })
    );
  },

  _renderErrorView: function (errorMessage) {
    var errorView = new ErrorView({
      title: _t('dataset.unlock.error', { tableName: this._tableName }),
      desc: errorMessage
    });
    this.$el.html(errorView.render().el);
    this.addView(errorView);
  },

  _$content: function () {
    return this.$('.js-content');
  },

  _onConfirm: function () {
    this._renderLoadingView();

    this._visModel.save({
      locked: false
    }, {
      wait: true,
      success: function () {
        this._modalModel.destroy();
      }.bind(this),
      error: function (mdl, e) {
        this._renderErrorView(errorParser(e));
      }.bind(this)
    });
  },

  _onCancel: function () {
    window.location = this._configModel.get('base_url');
  },

  clean: function () {
    this._disableBinds();
    CoreView.prototype.clean.apply(this);
  }

});
