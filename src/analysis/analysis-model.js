var _ = require('underscore');
var Model = require('../core/model');

module.exports = Model.extend({

  initialize: function (attrs, opts) {
    opts = opts || {};
    if (!opts.camshaftReference) {
      throw new Error('chamshaftReference is required');
    }

    if (!opts.map) {
      throw new Error('map is required');
    }

    this._camshaftReference = opts.camshaftReference;
    this._map = opts.map;

    this.bind('change:params', this._reloadMap, this);
  },

  _reloadMap: function (opts) {
    opts = opts || {};
    this._map.reload(opts);
  },

  findAnalysisById: function (analysisId) {
    if (this.get('id') === analysisId) {
      return this;
    }
    var sources = _.chain(this._getSourceNames())
      .map(function (sourceName) {
        var source = this.get('params')[sourceName];
        return source.findAnalysisById(analysisId);
      }, this)
      .compact()
      .value();

    return sources[0];
  },

  _getSourceNames: function () {
    return this._camshaftReference.getSourceNamesForAnalysisType([this.get('type')]);
  },

  remove: function () {
    this.trigger('destroy', this);
  },

  toJSON: function () {
    var params = _.clone(this.get('params'));
    // TODO: Instead of serializing all attributes, we could use the camshaft-reference
    // to pick the attributes that should be serialized
    var attributes = _.clone(this.attributes);
    var sources = {};
    var sourceNames = this._getSourceNames();
    for (var i in sourceNames) {
      var sourceName = sourceNames[i];
      sources[sourceName] = this.get('params')[sourceName].toJSON();
    }

    return _.extend(attributes, {
      params: _.extend(params, sources)
    });
  }
});
