var Backbone = require('backbone');
var _ = require('underscore');
var CoreView = require('backbone/core-view');
var WidgetLoaderView = require('./widget-loader-view');
var WidgetErrorView = require('./widget-error-view');
var errorEnhancer = require('../util/error-enhancer');
var getValue = require('../util/get-object-value');
var Utils = require('builder/helpers/utils');

var PLACEHOLDER_TEMPLATES = {
  category: require('./category/list/items-placeholder-template.tpl'),
  formula: require('./formula/placeholder.tpl'),
  histogram: require('./histogram/placeholder.tpl')
};

var MAX_BUCKETS = 367;

/**
 * Default widget view
 * The model is a expected to be widget model
 */
module.exports = CoreView.extend({
  className: 'CDB-Widget CDB-Widget--light',

  options: {
    columns_title: []
  },

  initialize: function () {
    this.errorModel = new Backbone.Model({});
    var dataviewModel = this.model.dataviewModel;

    this.listenTo(this.model, 'destroy', this.clean);
    this.listenTo(this.model, 'error', this._onError);
    this.listenTo(this.model, 'setDisabled', this._setDisabled);
    this.listenTo(dataviewModel, 'statusError', this._onError);
    this.listenTo(dataviewModel, 'sync change:data', this._onDataChanged);
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    this._appendView(new WidgetLoaderView({
      model: this.model.dataviewModel
    }));

    this._appendView(new WidgetErrorView({
      title: this.model.get('title'),
      errorModel: this.errorModel
    }));

    this._appendView(this.options.contentView);

    return this;
  },

  _onDataChanged: function (model) {
    if (this._noDataAvailable()) {
      this.options.contentView.$el.addClass('is-hidden');
      return this.errorModel.set({
        model: model,
        error: errorEnhancer({ type: 'no_data_available' }),
        placeholder: this._getPlaceholder()
      });
    }

    if (this._dataHasTooManyBins()) {
      this.options.contentView.$el.addClass('is-hidden');
      return this.errorModel.set({
        model: model,
        error: errorEnhancer({ type: 'too_many_bins' }),
        placeholder: this._getPlaceholder()
      });
    }

    if (!_.isEmpty(this.errorModel.get('error'))) {
      this.errorModel.clear();
      this.options.contentView.render();
      this.options.contentView.$el.removeClass('is-hidden');
    }
  },

  _onError: function (model, error) {
    if (error && error.message === 'abort') {
      return;
    }

    var enhancedError = errorEnhancer(error);

    this.options.contentView.$el.addClass('is-hidden');
    this.errorModel.set({
      model: model,
      error: enhancedError,
      placeholder: this._getPlaceholder()
    });
  },

  _appendView: function (view) {
    this.$el.append(view.render().el);
    this.addView(view);
  },

  _noDataAvailable: function () {
    var valueToCheck = this._isHistogram() ? 'totalAmount' : 'data';
    var data = this.model.dataviewModel.get(valueToCheck);

    return !Utils.hasValue(data) || (_.isArray(data) && _.isEmpty(data));
  },

  _dataHasTooManyBins: function () {
    if (this._isHistogram()) {
      var data = this.model.dataviewModel.getUnfilteredData && this.model.dataviewModel.getUnfilteredData();
      return !_.isEmpty(data) && _.size(data) > MAX_BUCKETS;
    }
    return false;
  },

  _isHistogram: function () {
    return this.model.dataviewModel.get('type') === 'histogram';
  },

  _extractError: function (response) {
    // XmlHttpRequest error?
    var errors = getValue(response, 'responseJSON.errors_with_context', []);
    if (errors.length > 0) {
      return errors[0];
    } else if (response && response.message) {
      response.type = response.type || 'generic';
      return response;
    }
    return {};
  },

  _getPlaceholder: function () {
    var widgetType = this.model.dataviewModel.get('type');
    return PLACEHOLDER_TEMPLATES[widgetType];
  },

  _setDisabled: function (model, selectedWidgetId) {
    var differentWidget = model.get('id') !== selectedWidgetId;

    if (selectedWidgetId && !differentWidget) {
      this.el.scrollIntoView && this.el.scrollIntoView();
    }

    this.$el.toggleClass('is-disabled', selectedWidgetId !== null && differentWidget);
  }
});
