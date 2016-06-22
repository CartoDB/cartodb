var _ = require('underscore');
var $ = require('jquery');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var StatView = require('./stat-view');
var createTuplesItems = require('./create-tuples-items');
var widgetsTypes = require('./widgets-types');
var dataNotReadyTemplate = require('./data-content-not-ready.tpl');
var LIMIT = 5;

module.exports = CoreView.extend({
  className: 'Editor-dataContent',

  initialize: function (opts) {
    if (!opts.widgetDefinitionsCollection) throw new Error('widgetDefinitionsCollection is required');
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.tableStats) throw new Error('tableStats is required');
    if (!opts.columnModel) throw new Error('columnModel is required');
    if (!opts.stackLayoutModel) throw new Error('StackLayoutModel is required');

    this._querySchemaModel = opts.querySchemaModel;
    this._columnModel = opts.columnModel;
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._analysisDefinitionNode = this._layerDefinitionModel.getAnalysisDefinitionNodeModel();
    this._widgetDefinitionsCollection = opts.widgetDefinitionsCollection;
    this._tableStats = opts.tableStats;
    this._stackLayoutModel = opts.stackLayoutModel;
    this._stats = 0;

    this._optionsCollection = new Backbone.Collection();
    this._initBinds();
    this._initData();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    if (this._hasFetchedQuerySchema()) {
      this._renderStats();
    } else {
      this._showLoading();
    }
    return this;
  },

  _initData: function () {
    if (this._querySchemaModel.get('status') !== 'fetching') {
      this._querySchemaModel.fetch();
    }

    if (this._querySchemaModel.get('status') === 'fetched') {
      this._createOptionsModels();
    }
  },

  _showLoading: function () {
    this.$el.append(
      dataNotReadyTemplate()
    );
  },

  _initBinds: function () {
    this._querySchemaModel.on('change', this._onQuerySchemaChange, this);
    this.add_related_model(this._querySchemaModel);
    this._optionsCollection.on('change:selected', this._handleWidget, this);
    this.add_related_model(this._optionsCollection);
  },

  _handleWidget: function (model) {
    var m;
    if (model.get('selected') === true) {
      m = model.createUpdateOrSimilar(this._widgetDefinitionsCollection);
      model.set({widget: m});
    } else {
      m = model.get('widget');
      m && m.destroy();
    }
  },

  _onQuerySchemaChange: function () {
    if (this._hasFetchedQuerySchema()) {
      this._createOptionsModels();
      this.render();
    }
  },

  _hasFetchedQuerySchema: function () {
    return this._querySchemaModel.get('status') === 'fetched';
  },

  _renderStats: function () {
    var self = this;
    var renderColumns = _.bind(this._renderColumns, this);

    this._columnModel.set({columns: this._optionsCollection.length});

    var promises = this._optionsCollection.map(function (stat, index) {
      var table = stat.get('table');
      var column = stat.get('name');
      var deferred = new $.Deferred();

      self._tableStats.graphFor(table, column, function (graph) {
        if (graph.stats) {
          stat.set({graph: graph});
        }
        deferred.resolve();
      });

      return deferred.promise();
    }, this);

    return $.when.apply($, promises).done(function () {
      var withStats = self._optionsCollection.filter(function (model) {
        return !!model.get('graph');
      });

      var withoutStats = self._optionsCollection.filter(function (model) {
        return !model.get('graph');
      });

      renderColumns(withStats, true);
      renderColumns(withoutStats, false);
    });
  },

  _renderColumns: function (stats, visibility) {
    _.each(stats, function (stat, index) {
      var isVisible = visibility ? index < LIMIT : false;
      var view = new StatView({
        widgetDefinitionsCollection: this._widgetDefinitionsCollection,
        stackLayoutModel: this._stackLayoutModel,
        tableStats: this._tableStats,
        statModel: stat,
        isVisible: isVisible
      });

      this.addView(view);
      this.$el.append(view.render().el);
    }, this);
  },

  _createOptionsModels: function () {
    this._optionsCollection.reset();
    var tuplesItems = createTuplesItems(this._analysisDefinitionNode, this._layerDefinitionModel);

    _.each(widgetsTypes, function (d) {
      var models = d.createOptionModels(tuplesItems, this._widgetDefinitionsCollection);
      this._optionsCollection.add(models);
    }, this);

    this._optionsCollection.reset(this._optionsCollection.shuffle());
  }
});
