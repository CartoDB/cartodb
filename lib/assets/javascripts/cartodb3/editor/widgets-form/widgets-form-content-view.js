var cdb = require('cartodb.js');
var $ = require('jquery');
var WidgetsDataFormView = require('./widgets-form-data-view');
var WidgetsStyleFormView = require('./widgets-form-style-view');

/**
 * View to render all necessary for the widget form
 */

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.tableModel) throw new Error('tableModel is required');
    if (!opts.widgetDefinitionModel) throw new Error('widgetDefinitionModel is required');
    this._tableModel = opts.tableModel;
    this._widgetDefinitionModel = opts.widgetDefinitionModel;

    this._widgetDefinitionModel.on('change:type', this.render, this);
  },

  render: function () {
    this.clearSubViews();
    this.$el.html('');
    this._initViews();
    return this;
  },

  _initViews: function () {
    this.clearSubViews();

    // TODO: carousel -> Form Widget Type
    var self = this;
    var $typeSelect = $('<select><option value="category">category</option><option value="formula">formula</option><option value="category">histogram</option><option value="time-series">time series</option></select>');
    $typeSelect.change(function (newType) {
      self._widgetDefinitionModel.changeType(this.value);
    });
    var widgetType = this._widgetDefinitionModel.get('type');
    $typeSelect.val(widgetType);
    this.$el.append($typeSelect);

    var formWidgetDataView = new WidgetsDataFormView({
      widgetDefinitionModel: this._widgetDefinitionModel,
      tableModel: this._tableModel
    });
    this.addView(formWidgetDataView);
    this.$el.append(formWidgetDataView.render().el);

    var formWidgetStyleView = new WidgetsStyleFormView({
      widgetDefinitionModel: this._widgetDefinitionModel
    });
    this.addView(formWidgetStyleView);
    this.$el.append(formWidgetStyleView.render().el);
  }
});
