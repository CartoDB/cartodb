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

  urlRoot: function () {
    // TODO implement properly
    return '/user/orgowner/api/v3/maps/' + this.get('map_id') + '/layers/' + this.get('layerId') + '/widgets';
  },

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
