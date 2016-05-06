var $ = require('jquery');
var _ = require('underscore');
var AnalysisDefinitionNodeModel = require('./analysis-definition-node-model');

/**
 * Special case of a node model representing a source node.
 */
module.exports = AnalysisDefinitionNodeModel.extend({

  /**
   * @override AnalysisDefinitionNodeModel.prototype.initialize
   */
  initialize: function (attrs, opts) {
    AnalysisDefinitionNodeModel.prototype.initialize.apply(this, arguments);

    if (!opts.sqlAPI) throw new Error('sqlAPI is required');
    this._sqlAPI = opts.sqlAPI;

    this.bind('change:query', function () {
      this._deferredOutputGeometryType = null;
    }, this);

    this.querySchemaModel.set({
      status: 'ready',
      query: this.get('query')
    });
  },

  /**
   * @override AnalysisDefinitionNodeModel.prototype.asyncGetOutputGeometryType
   * @param {Object} options
   * @param {Boolean} [options.noCache = false]
   */
  asyncGetOutputGeometryType: function (cb, options) {
    if (_.result(options, 'noCache') || !this._deferredOutputGeometryType) {
      var deferred = this._deferredOutputGeometryType = $.Deferred();
      this._sqlAPI.describeGeom(this.get('query'), 'the_geom', function (err, d) {
        if (err) {
          deferred.reject(err);
        } else {
          deferred.resolve(d.simplified_geometry_type);
        }
      });
    }

    this._deferredOutputGeometryType
      .done(function (geometryType) {
        if (geometryType) {
          cb(null, geometryType);
        } else {
          cb('no geometry value');
        }
      })
      .fail(function (err) {
        cb(err || 'something failed');
      });
  }

});
