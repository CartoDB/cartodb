var _ = require('underscore');
var $ = require('jquery');
var cdb = require('cartodb.js');
var camshaftReference = require('./camshaft-reference');

/**
 * Base model for an analysis definition node.
 * May point to one or multiple nodes in turn (referenced by ids).
 */
module.exports = cdb.core.Model.extend({

  initialize: function () {
    if (!this.id) throw new Error('id is required');
  },

  /**
   * @override {Backbone.prototype.parse}  flatten the provided analysis data and create source nodes if there are any.
   */
  parse: function (r, opts) {
    var sourceNames = camshaftReference.getSourceNamesForAnalysisType(r.type);

    var parsedParams = _.reduce(r.params, function (memo, val, name) {
      var sourceName = sourceNames[sourceNames.indexOf(name)];

      if (sourceName) {
        this.collection.add(val, opts);
        memo[name] = val.id;
      } else {
        memo[name] = val;
      }

      return memo;
    }, {}, this);

    return _.defaults(
      _.omit(r, 'params'),
      parsedParams
    );
  },

  /**
   * @override {Backbone.prototype.toJSON} unflatten the internal structure to the expected nested JSON data structure.
   */
  toJSON: function () {
    var sourceNames = camshaftReference.getSourceNamesForAnalysisType(this.get('type'));
    var paramNames = camshaftReference.getParamNamesForAnalysisType(this.get('type'));

    // Undo the parsing of the params previously done in .parse() (when model was created)
    var rawParams = _.reduce(paramNames, function (memo, name) {
      if (_.contains(sourceNames, name)) {
        var sourceId = this.get(name);
        memo[name] = this.collection.get(sourceId).toJSON();
      } else {
        memo[name] = this.get(name);
      }

      return memo;
    }, {}, this);

    var json = _.omit(this.attributes, paramNames.concat('deferred_output_geometry_type'));
    json.params = rawParams;
    return json;
  },

  /**
   * @param {Boolean} [retryIfRejected = false] - Set to true to force a new deferred value
   * @return {Object} A promise, which when resolved contains a {String}, e.g. 'line', 'point', 'polygon'
   */
  getOutputGeometryType: function (retryIfRejected) {
    var deferred = this.get('deferred_output_geometry_type');

    if (_.result(deferred, 'state') === 'rejected' && retryIfRejected) {
      deferred = null;
    }

    if (!deferred) {
      deferred = $.Deferred();
      this.set('deferred_output_geometry_type', deferred);
      this._fetchGeometryType(deferred);
    }

    return deferred.promise();
  },

  destroy: function () {
    this.collection.remove(this);
  },

  getPrimarySourceId: function () {
    var primarySourceName = this.get('primary_source_name') || this._sourceNames()[0];
    return this.get(primarySourceName);
  },

  /**
   * @return {Array} e.g. ['c3', 'b2']
   */
  sourceIds: function () {
    return _.map(this._sourceNames(), function (sourceName) {
      return this.get(sourceName);
    }, this);
  },

  /**
   * @return {Array} e.g. ['polygons_source', 'points_source']
   */
  _sourceNames: function () {
    return camshaftReference.getSourceNamesForAnalysisType(this.get('type'));
  },

  /**
   * @protected
   * @param {Object} deferred object
   */
  _fetchGeometryType: function (deferred) {
    var definition = this.toJSON();
    var geometryType = camshaftReference.getOutputGeometryForType(definition);
    deferred.resolve(geometryType);
  }

});
