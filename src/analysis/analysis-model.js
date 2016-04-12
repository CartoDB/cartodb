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
    this.bind('change:type', this._reloadMap, this);
    _.each(this._getParamNames(), function (paramName) {
      this.bind('change:' + paramName, this._reloadMap, this);
    }, this);
  },

  _reloadMap: function (opts) {
    opts = opts || {};
    this._map.reload(opts);
  },

  remove: function () {
    this.trigger('destroy', this);
  },

  findAnalysisById: function (analysisId) {
    if (this.get('id') === analysisId) {
      return this;
    }
    var sources = _.chain(this._getSourceNames())
      .map(function (sourceName) {
        var source = this.get(sourceName);
        return source.findAnalysisById(analysisId);
      }, this)
      .compact()
      .value();

    return sources[0];
  },

  _getSourceNames: function () {
    return this._camshaftReference.getSourceNamesForAnalysisType(this.get('type'));
  },

  toJSON: function () {
    var json = _.pick(this.attributes, 'id', 'type');
    json.params = _.pick(this.attributes, this._getParamNames());
    _.each(this._getSourceNames(), function (sourceName) {
      var source = {};
      source[sourceName] = this.get(sourceName).toJSON();
      _.extend(json.params, source);
    }, this);

    return json;
  },

  _getParamNames: function () {
    return this._camshaftReference.getParamNamesForAnalysisType(this.get('type'));
  }
});
