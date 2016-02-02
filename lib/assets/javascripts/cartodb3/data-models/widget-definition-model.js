var cdb = require('cartodb-deep-insights.js');

/**
 * Widget definition Model
 */
module.exports = cdb.core.Model.extend({

  _createWidgetModelMap: {
    formula: function () {
      var o = this.get('options');
      return this._dashboardWidgetsService.createFormulaModel({
        id: this.id,
        title: this.get('title'),
        column: o.column,
        operation: o.operation
      }, this._layerDefModel.layerModel);
    }
  },

  initialize: function (attrs, options) {
    if (!options.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!options.dashboardWidgetsService) throw new Error('dashboardWidgetsService is required');

    this._layerDefModel = options && options.layerDefinitionModel;
    this._widgetModel = options && options.widgetModel;
    this._dashboardWidgetsService = options && options.dashboardWidgetsService;

    this.on('sync', this._onSync, this);
    this.on('destroy', this._onDestroy, this);
  },

  url: function () {
    var url = this._layerDefModel.url() + '/widgets';
    return this.isNew()
      ? url
      : url + '/' + this.id;
  },

  parse: function (attrs) {
    attrs.options = JSON.parse(attrs.options);
    return attrs;
  },

  toJson: function () {
    return {
      id: this.get('id'),
      type: this.get('type'),
      title: this.get('title'),
      layer_id: this._layerDefModel.id,
      options: this.get('options') || {}
    };
  },

  _onSync: function () {
    if (!this._widgetModel) {
      // No model yet; this was a new widget definition, so create the actual widget model
      // TODO error handling, for now let errors bubble up
      this._widgetModel = this._createWidgetModelMap[this.get('type')].call(this);
    }
  },

  _onDestroy: function () {
    if (this._widgetModel) {
      this._widgetModel.remove();
    }
  }

});
