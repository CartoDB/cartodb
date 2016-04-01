var d3 = require('d3-queue');
var cdb = require('cartodb-deep-insights.js');

/**
 * Form model for a point-in-polygon
 * It has a rather complicated schema, that depends on several data points and state.
 */
module.exports = cdb.core.Model.extend({

  initialize: function (attrs, opts) {
    if (!opts.analysisDefinitionNodeModel) throw new Error('analysisDefinitionNodeModel is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');

    this._analysisDefinitionNodeModel = opts.analysisDefinitionNodeModel;
    this._layerDefinitionModel = opts.layerDefinitionModel;

    // Source options should buckets per geometry type
    this._sourceOptionsMap = {};
    this._updateSchema();

    var queue = d3.queue();
    this._createSourceOptions(queue);
    queue.awaitAll(this._updateSchema.bind(this));
  },

  validate: function (attrs, opts) {
    return this._analysisDefinitionNodeModel.validate(this.attributes, opts);
  },

  _updateSchema: function () {
    this.schema = {
      points_source: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.points_source'),
        options: this._getSourceOptionsForSource('points_source', 'point')
      },
      polygons_source: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.polygons_source'),
        options: this._getSourceOptionsForSource('polygons_source', 'polygon')
      }
    };
    this.trigger('changeSchema', this);
  },

  _getSourceOptionsForSource: function (sourceName, requiredGeometryType) {
    var options;

    // Only secondary source may be changed
    if (sourceName !== this.get('primary_source_name')) {
      options = this._sourceOptionsMap[requiredGeometryType];
    }

    return options || [ this.get(sourceName) ];
  },

  _createSourceOptions: function (queue) {
    var sourceOptionsMap = this._sourceOptionsMap;
    var nodesCollection = this._analysisDefinitionNodeModel.collection;

    this._layerDefinitionModel
      .collection
      .each(function (m) {
        if (m !== this._layerDefinitionModel) {
          var sourceId = m.get('source');
          var nodeModel = nodesCollection.get(sourceId);

          if (nodeModel) {
            queue.defer(function (cb) {
              nodeModel.asyncGetOutputGeometryType(function (err, geometryType) {
                if (!err) {
                  sourceOptionsMap[geometryType] = sourceOptionsMap[geometryType] || [];
                  sourceOptionsMap[geometryType].push({
                    val: nodeModel.id,
                    label: nodeModel.id + ' - ' + m.getName()
                  });
                }

                cb(); // regardless of output, resolve as success
              });
            });
          }
        }
      }, this);
  }

});
