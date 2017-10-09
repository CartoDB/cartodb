var _ = require('underscore');
var cdb = require('cartodb.js');
var WidgetLoaderView = require('./widget-loader-view');
var WidgetErrorView = require('./widget-error-view');
var errorEnhancer = require('../util/error-enhancer');
var getValue = require('../util/get-object-value');

var PLACEHOLDER_TEMPLATES = {
  category: require('./category/list/items-placeholder-template.tpl'),
  formula: require('./formula/placeholder.tpl'),
  histogram: require('./histogram/placeholder.tpl')
};

/**
 * Default widget view
 * The model is a expected to be widget model
 */
module.exports = cdb.core.View.extend({
  className: 'CDB-Widget CDB-Widget--light',

  options: {
    columns_title: []
  },

  initialize: function () {
    var dataviewModel = this.model.dataviewModel;

    this.listenTo(this.model, 'destroy', this.clean);
    this.listenTo(dataviewModel, 'error', this._onError);
    this.listenTo(dataviewModel, 'sync change:data', this._onDataChanged);

    if (dataviewModel && dataviewModel._totals) {
      this.listenTo(dataviewModel._totals, 'error', this._onError);
    }
  },

  render: function (model, error) {
    this.clearSubViews();
    this.$el.empty();

    var widgetModel = this.model;
    var dataviewModel = widgetModel.dataviewModel;
    var placeholder = PLACEHOLDER_TEMPLATES[dataviewModel.get('type')];

    this._appendView(new WidgetLoaderView({
      model: dataviewModel
    }));

    if (error) {
      this._appendView(new WidgetErrorView({
        title: this.model.get('title'),
        error: error,
        model: model,
        placeholder: placeholder
      }));
    } else {
      this._appendView(this.options.contentView);
    }

    return this;
  },

  _onDataChanged: function (model) {
    return this._noDataAvailable()
      ? this.render(model, errorEnhancer({ type: 'no_data_available' }))
      : this.render(model);
  },

  _onError: function (model, response) {
    var error = this._extractError(response);
    var enhancedError = errorEnhancer(error);

    return this.render(model, enhancedError);
  },

  _appendView: function (view) {
    this.$el.append(view.render().el);
    this.addView(view);
  },

  _noDataAvailable: function () {
    var valueToCheck = this._isHistogram() ? 'totalAmount' : 'data';
    var data = this.model.dataviewModel.get(valueToCheck);

    return !data || (_.isArray(data) && _.isEmpty(data));
  },

  _isHistogram: function () {
    return this.model.dataviewModel.get('type') === 'histogram';
  },

  _extractError: function (response) {
    var errors = getValue(response, 'responseJSON.errors_with_context', []);
    return errors[0] || {};
  }
});
