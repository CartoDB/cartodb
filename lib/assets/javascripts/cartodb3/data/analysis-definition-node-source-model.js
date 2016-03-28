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

    this.bind('change:query', this.unset.bind(this, 'output_geometry_promise'));
  },

  /**
   * @override AnalysisDefinitionNodeModel.prototype._fetchGeometryType
   */
  _fetchGeometryType: function (promise) {
    this._sqlAPI.describeGeom(this.get('query'), 'the_geom', function (err, d) {
      if (err) {
        promise.reject(err);
      } else {
        promise.resolve(d.simplified_geometry_type);
      }
    });
  }

});
