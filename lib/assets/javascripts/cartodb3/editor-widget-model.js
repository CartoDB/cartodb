var cdb = require('cartodb-deep-insights.js');

/**
 *  Editor widget Model
 *
 *  - new EditorWidgetModel({
 *      map_id: 'xxx',
 *      layerId: 'xxx'
 *    });
 *
 */
module.exports = cdb.core.Model.extend({

  initialize: function (attrs, options) {
    this._diWidgetModel = options && options.diWidgetModel;
  },

  setReferenceWidgetModel: function (referenceModel) {
    if (!referenceModel || this._diWidgetModel) {
      return false;
    }
    this._diWidgetModel = referenceModel;
  },

  updateReferenceWidgetModel: function () {
    // this._diWidgetModel.set(this.toJSON()); ??
  }

});
