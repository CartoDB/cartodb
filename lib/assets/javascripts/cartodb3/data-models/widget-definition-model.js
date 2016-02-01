var cdb = require('cartodb-deep-insights.js');

/**
 * Widget definition Model
 */
module.exports = cdb.core.Model.extend({

  initialize: function (attrs, options) {
    if (!options.layerDefinitionModel) throw new Error('layerDefinitionModel is required');

    this._layerDefModel = options && options.layerDefinitionModel;
    this._widgetModel = options && options.widgetModel;
  },

  url: function () {
    return this._layerDefModel.url() + '/widgets/' + this.id;
  },

  setReferenceWidgetModel: function (referenceModel) {
    if (!referenceModel || this.widgetModel) {
      return false;
    }
    this._widgetModel = referenceModel;
  },

  updateReferenceWidgetModel: function () {
    // this._widgetModel.set(this.toJSON()); ??
  }

});
