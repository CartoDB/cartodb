var _ = require('underscore');
var Model = require('../core/model');
var ANALYSIS_TYPE_TO_SOURCE_PARAM_NAMES_MAP = require('./source-names-map');

module.exports = Model.extend({

  initialize: function (attrs, opts) {
    opts = opts || {};
    this._sourceNamesMap = opts.sourceNamesMap || ANALYSIS_TYPE_TO_SOURCE_PARAM_NAMES_MAP;
  },

  findAnalysisById: function (analysisId) {
    if (this.get('id') === analysisId) {
      return this;
    }

    // TODO: This same thing is duplicated in analysis-factory.js
    var sourceNames = this._sourceNamesMap[this.get('type')];
    if (!sourceNames) {
      throw new Error('source names for type ' + this.get('type') + " couldn't be found");
    }

    var sources = _.chain(sourceNames)
      .map(function (sourceName) {
        var source = this.get('params')[sourceName];
        return source.findAnalysisById(analysisId);
      }, this)
      .compact()
      .value();

    return sources[0];
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
