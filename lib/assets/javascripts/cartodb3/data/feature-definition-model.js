var Backbone = require('backbone');

var TYPES_POINT = 'point';
var TYPES_POLYGON = 'polygon';
var TYPES_LINE = 'line';

var FeatureDefinitionModel = Backbone.Model.extend({
  isPoint: function () {
    return this._isType(TYPES_POINT);
  },

  isPolygon: function () {
    return this._isType(TYPES_POLYGON);
  },

  isLine: function () {
    return this._isType(TYPES_LINE);
  },

  _isType: function (type) {
    return this.get('type') === type;
  }
});

module.exports = FeatureDefinitionModel;
