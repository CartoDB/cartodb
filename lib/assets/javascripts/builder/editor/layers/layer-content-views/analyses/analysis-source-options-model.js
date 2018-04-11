var _ = require('underscore');
var queueAsync = require('d3-queue').queue;
var Backbone = require('backbone');
var analyses = require('builder/data/analyses');

/**
 * Analysis source options are not trivial to get and requires some coordination of events.
 *
 * It's intended to be fetched
 */
module.exports = Backbone.Model.extend({

  defaults: {
    fetching: false,
    nodes_options: []
  },

  initialize: function (attrs, opts) {
    if (!opts.analysisDefinitionNodesCollection) throw new Error('analysisDefinitionNodesCollection is required');
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.tablesCollection) throw new Error('tablesCollection is required');

    this._analysisDefinitionNodesCollection = opts.analysisDefinitionNodesCollection;
    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._tablesCollection = opts.tablesCollection;
  },

  fetch: function () {
    this.set({
      fetching: true,
      nodes_options: []
    });

    var queue = queueAsync();

    this._fetchTables(queue);
    this._createOptionsFromNodes(queue);

    queue.awaitAll(function () {
      this.set('fetching', false);
    }.bind(this));
  },

  /**
   * @param {String, Array<String>} requiredSimpleGeometryTypes
   */
  getSelectOptions: function (requiredSimpleGeometryTypes) {
    var nodeOptions = this.get('nodes_options');
    if (this.get('fetching') && nodeOptions.length === 0) {
      return nodeOptions;
    }

    if (_.isString(requiredSimpleGeometryTypes)) {
      requiredSimpleGeometryTypes = [requiredSimpleGeometryTypes];
    }

    return _.flatten([
      nodeOptions
        .filter(function (d) {
          return this._isValidGeometry(requiredSimpleGeometryTypes, d.simpleGeometryType);
        }, this)
        .map(function (d) {
          var node = this._analysisDefinitionNodesCollection.get(d.val);
          var layer = this._layerDefinitionsCollection.findOwnerOfAnalysisNode(node);
          var layerName = node.isSourceType()
            ? layer.getTableName()
            : layer.getName();

          return _.extend({
            layerName: layerName,
            nodeTitle: analyses.short_title(node),
            color: node.getColor(),
            type: 'node',
            isSourceType: node.isSourceType()
          }, d);
        }, this),
      this._getTablesSelectOptions(requiredSimpleGeometryTypes)
    ]);
  },

  /**
   * @param {String} val val from select option
   */
  createSourceNodeUnlessExisting: function (val) {
    var tableModel = this._tablesCollection.get(val);

    // If there is no table with given val as id, then it must be a layer source which already exist, so nothing to do
    if (tableModel) {
      var tableName = tableModel.get('name');
      this._analysisDefinitionNodesCollection.createSourceNode({
        id: tableName, // to avoid duplicats
        tableName: tableName
      });
    }
  },

  _isValidGeometry: function (requiredSimpleGeometryTypes, simpleGeometryType) {
    return _.contains(requiredSimpleGeometryTypes, simpleGeometryType) || requiredSimpleGeometryTypes[0] === '*';
  },

  _fetchTables: function (queue) {
    queue.defer(function (cb) {
      this._tablesCollection.fetch({
        data: {
          show_likes: false,
          show_liked: false,
          show_stats: false,
          show_table_size_and_row_count: false,
          show_permission: false,
          show_synchronization: false,
          show_uses_builder_features: false,
          load_totals: false,
          per_page: 1000
        }
      });
      this._tablesCollection.once('sync error', function () {
        cb();
      });
    }.bind(this));
  },

  _createOptionsFromNodes: function (queue) {
    var self = this;

    this._analysisDefinitionNodesCollection
      .each(function (nodeDefModel) {
        var queryGeometryModel = nodeDefModel.queryGeometryModel;

        queue.defer(function (cb) {
          if (queryGeometryModel.isFetched()) {
            self._appendNodeOption(nodeDefModel);
            return cb();
          }

          if (!queryGeometryModel.canFetch()) {
            return cb();
          }

          var onStatusChange = function () {
            if (queryGeometryModel.get('status') === 'fetching') return;
            queryGeometryModel.off('change:status', onStatusChange);
            self._appendNodeOption(nodeDefModel);
            cb();
          };
          queryGeometryModel.on('change:status', onStatusChange);
          queryGeometryModel.fetch();
        });
      });
  },

  _appendNodeOption: function (nodeDefModel) {
    var geom = nodeDefModel.queryGeometryModel.get('simple_geom');
    // If a node doesn't belong to a layer, we should not append it as a node option
    // It could be an intersection node, for example.
    var belongsToLayer = this._layerDefinitionsCollection.findOwnerOfAnalysisNode(nodeDefModel);

    if (!geom || !belongsToLayer) return;

    this.get('nodes_options')
      .push({
        simpleGeometryType: geom,
        val: nodeDefModel.id,
        label: nodeDefModel.id
      });
  },

  _getTablesSelectOptions: function (requiredSimpleGeometryTypes) {
    return this._tablesCollection.reduce(function (memo, m) {
      var simpleGeometryType = m.getGeometryType()[0];

      if (this._isValidGeometry(requiredSimpleGeometryTypes, simpleGeometryType)) {
        memo.push({
          val: m.id,
          label: m.get('name'),
          type: 'dataset'
        });
      }

      return memo;
    }, [], this);
  }

});
