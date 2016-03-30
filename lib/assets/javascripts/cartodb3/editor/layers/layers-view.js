var cdb = require('cartodb-deep-insights.js');
var LayerAnalysisViewFactory = require('./layer-analysis-view-factory');
var LayerAnalysisViews = require('./layer-analysis-views');
var AddAnalysisView = require('../../components/modals/add-analysis/add-analysis-view');
var template = require('./layers.tpl');

require('jquery-ui/droppable');

var DROPPABLE_SCOPE = 'analysis';

var DefaultLayerView = require('./layer-view');
var BasemapLayerView = require('./basemap-layer-view');

/**
 * View to render layer definitions list
 */
module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.stackLayoutModel) throw new Error('stackLayoutModel is required');
    if (!opts.modals) throw new Error('modals is required');
    if (!opts.analysisDefinitionsCollection) throw new Error('analysisDefinitionsCollection is required');
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');

    this._modals = opts.modals;
    this._stackLayoutModel = opts.stackLayoutModel;
    this._analysisDefinitionNodesCollection = opts.analysisDefinitionsCollection.analysisDefinitionNodesCollection;
    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;

    this._layerAnalysisViewFactory = new LayerAnalysisViewFactory(this._analysisDefinitionNodesCollection);

    this.listenTo(this._layerDefinitionsCollection, 'add', this._addLayerView);
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(template);

    this._layerDefinitionsCollection.each(this._addLayerView, this);

    return this;
  },

  _addLayerView: function (m) {
    var view;
    if (m.get('order') === 0) {
      view = new BasemapLayerView({
        model: m
      });
    } else {
      view = new DefaultLayerView({
        model: m,
        newAnalysisViews: this._newAnalysisViews.bind(this),
        openAddAnalysis: this._openAddAnalysis.bind(this),
        stackLayoutModel: this._stackLayoutModel
      });
    }

    this.addView(view);
    this.$('.js-layers').append(view.render().el);

    this._initDroppable();
  },

  _initDroppable: function () {
    this.$('.js-drop').droppable({
      scope: DROPPABLE_SCOPE,
      accept: '.js-analysis Editor-ListAnalysis-item',
      hoverClass: 'is-active',
      drop: function (e, ui) {
        ui.helper.data('dropped', true); // notifies the draggable that a new item was dropped
      }
    });
  },

  _destroyDroppable: function () {
    if (this.$('.js-drop').data('ui-droppable')) {
      this.$('.js-drop').droppable('destroy');
    }
  },

  /**
   * As defined by default-layer-view
   */
  _newAnalysisViews: function (el, layerDefinitionModel) {
    return new LayerAnalysisViews({
      el: el,
      model: layerDefinitionModel,
      analysisDefinitionNodesCollection: this._analysisDefinitionNodesCollection,
      layerAnalysisViewFactory: this._layerAnalysisViewFactory
    });
  },

  _openAddAnalysis: function (layerDefinitionModel) {
    var sourceId = layerDefinitionModel.get('source');
    var analysisDefinitionNodeModel = this._analysisDefinitionNodesCollection.get(sourceId);

    this._modals.create(function (modalModel) {
      return new AddAnalysisView({
        modalModel: modalModel,
        layerDefinitionModel: layerDefinitionModel,
        analysisDefinitionNodeModel: analysisDefinitionNodeModel
      });
    });
  },

  clean: function () {
    this._destroyDroppable();
    cdb.core.View.prototype.clean.apply(this);
  }
});
