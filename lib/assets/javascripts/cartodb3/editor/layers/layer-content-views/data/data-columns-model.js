var $ = require('jquery');
var Backbone = require('backbone');
var createTuplesItems = require('./create-tuples-items');
var widgetsTypes = require('./widgets-types');

module.exports = Backbone.Model.extend({
  defaults: {
    render: false
  },

  initialize: function (attrs, opts) {
    if (!opts.layerDefinitionModel) { throw new Error('layerDefinitionModel is required'); }
    if (!opts.widgetDefinitionsCollection) { throw new Error('widgetDefinitionsCollection is required'); }
    if (!opts.tableStats) { throw new Error('tablestats is required'); }

    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._analysisDefinitionNode = this._layerDefinitionModel.getAnalysisDefinitionNodeModel();
    this._widgetDefinitionsCollection = opts.widgetDefinitionsCollection;
    this._tableStats = opts.tableStats;
    this._columnsCollection = new Backbone.Collection();
  },

  getCollection: function () {
    return this._columnsCollection;
  },

  createColumnCollection: function () {
    var tuplesItems = createTuplesItems(this._analysisDefinitionNode, this._layerDefinitionModel);
    var models = widgetsTypes(tuplesItems);
    this._columnsCollection.reset(models);
    this._generateGraphs();
  },

  _generateGraphs: function () {
    var self = this;

    var promises = this._columnsCollection.map(function (stat) {
      var table = stat.get('table');
      var column = stat.get('name');
      var deferred = new $.Deferred();

      self._locateWidget(stat);

      self._tableStats.graphFor(table, column, function (graph) {
        if (graph.stats) {
          stat.set({graph: graph});
        }
        deferred.resolve();
      });

      return deferred.promise();
    }, this);

    $.when.apply($, promises).done(function () {
      self.set({render: self._columnsCollection.length > 0});
    });
  },

  findWidget: function (model) {
    var type = model.get('type');
    var column = model.get('name');

    return this._widgetDefinitionsCollection.findWhere({
      type: type,
      source: model.analysisDefinitionNodeModel().id,
      column: column
    });
  },

  _locateWidget: function (model) {
    var widget = this.findWidget(model);

    if (widget) {
      model.set({
        selected: true,
        widget: widget
      }, {silent: true});
    }
  },

  getColumnsWithWidgetAndGraph: function () {
    return this._columnsCollection.filter(function (model) {
      return !!model.get('widget') && !!model.get('graph');
    });
  },

  getColumnsWithWidget: function () {
    return this._columnsCollection.filter(function (model) {
      return !!model.get('widget') && !model.get('graph');
    });
  },

  getColumnsWithGraph: function () {
    return this._columnsCollection.filter(function (model) {
      return !!model.get('graph') && !model.get('widget');
    });
  },

  getColumnsWithoutGraph: function () {
    return this._columnsCollection.filter(function (model) {
      return !model.get('graph') && !model.get('widget');
    });
  }
});
