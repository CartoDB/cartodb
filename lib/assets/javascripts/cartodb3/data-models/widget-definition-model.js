var cdb = require('cartodb-deep-insights.js');

/**
 * Widget definition Model
 */
module.exports = cdb.core.Model.extend({

  initialize: function (attrs, options) {
    if (!options.layerDefinitionModel) throw new Error('layerDefinitionModel is required');

    this._layerDefModel = options && options.layerDefinitionModel;
    this._widgetModel = options && options.widgetModel;
    this.once('destroy', this._onDestroy, this);
  },

  url: function () {
    var url = this._layerDefModel.url() + '/widgets';
    return this.isNew()
      ? url
      : url + '/' + this.id;
  },

  setReferenceWidgetModel: function (referenceModel) {
    if (!referenceModel || this._widgetModel) {
      return false;
    }
    this._widgetModel = referenceModel;
  },

  updateReferenceWidgetModel: function () {
    // this._widgetModel.set(this.toJSON()); ??
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

  _onDestroy: function () {
    this._widgetModel.remove();
  }

});
