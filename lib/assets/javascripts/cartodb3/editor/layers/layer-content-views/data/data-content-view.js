var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var StatView = require('./stat-view');
var createTuplesItems = require('../../../../components/modals/add-widgets/create-tuples-items');
var widgetsTypes = require('./widgets-types');

module.exports = CoreView.extend({
  className: 'Editor-dataContent',

  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.widgetDefinitionsCollection) throw new Error('widgetDefinitionsCollection is required');
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.modals) throw new Error('modals is required');
    if (!opts.moreStatsModel) throw new Error('moreStatsModel is required');

    this._querySchemaModel = opts.querySchemaModel;
    this._configModel = opts.configModel;
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._modals = opts.modals;
    this._moreStatsModel = opts.moreStatsModel;
    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._widgetDefinitionsCollection = opts.widgetDefinitionsCollection;

    this._optionsCollection = new Backbone.Collection();
    this._analysisDefinitionNodesCollection = this._layerDefinitionsCollection.getAnalysisDefinitionNodesCollection();

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    if (this._hasFetchedAllQuerySchemas()) {
      this._createOptionsModels();
      this._renderStats();
    }
    return this;
  },

  _initBinds: function () {
    this._analysisDefinitionNodesCollection.each(function (model) {
      var querySchema = model.querySchemaModel;
      querySchema.on('change', this._onQuerySchemaChange, this);
      this.add_related_model(querySchema);
      querySchema.fetch();
    }, this);

    this._optionsCollection.on('change:selected', this._handleWidget, this);
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
    if (this._hasFetchedAllQuerySchemas()) {
      this.render();
    }
  },

  _hasFetchedAllQuerySchemas: function () {
    return this._analysisDefinitionNodesCollection.all(function (m) {
      return m.querySchemaModel.get('status') !== 'fetching';
    });
  },

  _renderStats: function () {
    this._moreStatsModel.set({
      total: 0,
      shown: 0,
      visible: false
    });

    this._totalStats = this._optionsCollection.length;
    this._renderedStats = 0;

    this._optionsCollection.forEach(function (stat) {
      var view = new StatView({
        configModel: this._configModel,
        widgetDefinitionsCollection: this._widgetDefinitionsCollection,
        moreStatsModel: this._moreStatsModel,
        statModel: stat
      });

      this.listenToOnce(view, 'stat:render', this._onStatReady);
      this.addView(view);
      this.$el.append(view.render().el);
    }, this);
  },

  _onStatReady: function () {
    this._renderedStats++;
    if (this._totalStats === this._renderedStats) {
      this._moreStatsModel.set({visible: true});
    }
  },

  _createOptionsModels: function () {
    this._optionsCollection.reset();
    var tuplesItems = createTuplesItems(this._analysisDefinitionNodesCollection, this._layerDefinitionsCollection);

    _.each(widgetsTypes, function (d) {
      var models = d.createOptionModels(tuplesItems, this._widgetDefinitionsCollection);
      this._optionsCollection.add(models);
    }, this);
  }
});
