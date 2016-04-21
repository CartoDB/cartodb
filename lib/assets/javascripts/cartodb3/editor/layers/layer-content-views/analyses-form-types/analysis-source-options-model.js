var d3 = require('d3-queue');
var cdb = require('cartodb.js');
var getSimpleGeometryType = require('../../../../data/get-simple-geometry-type');

/**
 * Analysis source options are not trivial to get and requires some coordination of events.
 *
 * It's intended to be fetched
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    fetching: false,
    layer_source_select_options: []
  },

  initialize: function (attrs, opts) {
    if (!opts.analysisDefinitionNodesCollection) throw new Error('analysisDefinitionNodesCollection is required');
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.tablesCollection) throw new Error('layerDefinitionsCollection is required');

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._analysisDefinitionNodesCollection = opts.analysisDefinitionNodesCollection;
    this._tablesCollection = opts.tablesCollection;
  },

  fetch: function () {
    this.set({
      fetching: true,
      layer_source_select_options: []
    });

    var queue = d3.queue();

    this._fetchTables(queue);
    this._createLayerSourceOptions(queue);

    queue.awaitAll(function () {
      this.set('fetching', false);
    }.bind(this));
  },

  getSelectOptions: function (requiredGeometryType) {
    if (this.get('fetching')) {
      return [];
    } else {
      var layerSourceOpts = this
        .get('layer_source_select_options')
        .filter(function (d) {
          return d.geometryType === requiredGeometryType;
        });
      return layerSourceOpts.concat(this._getTablesSelectOptions(requiredGeometryType));
    }
  },

  /**
   * @param {String} val val from select option
   */
  createSourceNodeUnlessExisting: function (val) {
    var tableModel = this._tablesCollection.get(val);

    // If there is no table with given val as id, then it must be a layer source which already exist, so nothing to do
    if (tableModel) {
      var tableName = tableModel.get('name');
      this._analysisDefinitionNodesCollection.add({
        id: tableName, // avoid duplicats
        type: 'source',
        table_name: tableName,
        params: {
          query: 'SELECT * FROM ' + tableName
        }
      });
    }
  },

  _fetchTables: function (queue) {
    queue.defer(function (cb) {
      this._tablesCollection.fetch();
      this._tablesCollection.once('sync error', function () {
        cb();
      });
    }.bind(this));
  },

  _createLayerSourceOptions: function (queue) {
    this._layerDefinitionsCollection
      .each(function (m) {
        var sourceId = m.get('source');
        var layerName = m.getName();
        var nodeModel = this._analysisDefinitionNodesCollection.get(sourceId);

        if (nodeModel) {
          var layerSourceSelectOptions = this.get('layer_source_select_options');

          queue.defer(function (cb) {
            nodeModel.asyncGetOutputGeometryType(function (err, geometryType) {
              if (!err) {
                layerSourceSelectOptions.push({
                  geometryType: geometryType,
                  val: nodeModel.id,
                  label: nodeModel.id + ' (' + layerName + ')'
                });
              }

              // Discard faulty output geometries,
              cb();
            });
          });
        }
      }, this);
  },

  _getTablesSelectOptions: function (geometryType) {
    return this._tablesCollection.reduce(function (memo, m) {
      var simpleGeometryType = getSimpleGeometryType(m.get('geometry_types')[0] || '');

      if (simpleGeometryType === geometryType) {
        memo.push({
          val: m.id,
          label: m.get('name')
        });
      }

      return memo;
    }, []);
  }

});
