var _ = require('underscore');
var cdb = require('cartodb.js');
var WidgetLoaderView = require('./widget-loader-view');
var WidgetErrorView = require('./widget-error-view');
var errorEnhancer = require('../util/error-enhancer');

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
    this.listenTo(this.model, 'destroy', this.clean);
    this.listenTo(this.model.dataviewModel, 'all', this._onDataviewModelEvent);

    if (this.model.dataviewModel._totals) {
      this.listenTo(this.model.dataviewModel._totals, 'all', this._onDataModelEvent);
    }
  },

  render: function (model, error) {
    this.clearSubViews();
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

  _onDataviewModelEvent: function (type, error, model) {
    var enhancedError = errorEnhancer(error);

    if (type.lastIndexOf('error', 0) === 0) {
      return this.render(model, enhancedError);
    }

    if (type === 'sync' || type === 'change:data') {
      return this._noDataAvailable()
        ? this.render(model, errorEnhancer({ type: 'no_data_available' }))
        : this.render(model);
    }
  },

  _onDataModelEvent: function (type, error, model) {
    var enhancedError = errorEnhancer(error);

    if (type.lastIndexOf('error', 0) === 0) {
      return this.render(model, enhancedError);
    }
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
  }
});
