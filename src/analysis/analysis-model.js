var _ = require('underscore');
var Model = require('../core/model');

module.exports = Model.extend({
  findAnalysisById: function (analysisId) {
    if (this.get('id') === analysisId) {
      return this;
    }
    if (this.get('params').source) {
      var source = this.get('params').source;
      return source.findAnalysisById(analysisId);
    }
  },

  remove: function () {
    this.trigger('destroy', this);
  },

  toJSON: function () {
    var json;
    var params;
    if (this.get('type') === 'source') {
      json = this.attributes;
    } else if (['trade-area', 'estimated-population', 'union'].indexOf(this.get('type')) >= 0) {
      params = _.clone(this.get('params'));
      json = {
        id: this.get('id'),
        type: this.get('type'),
        params: _.extend(params, {
          source: this.get('params').source.toJSON()
        })
      };
    } else if (this.get('type') === 'point-in-polygon') {
      params = _.clone(this.get('params'));
      json = {
        id: this.get('id'),
        type: this.get('type'),
        params: _.extend(params, {
          points_source: this.get('params').points_source.toJSON(),
          polygons_source: this.get('params').polygons_source.toJSON()
        })
      };
    }
    return json;
  }
});
