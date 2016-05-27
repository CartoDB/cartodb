var _ = require('underscore');
var cdb = require('cartodb.js');
var LayerAnalysisViewFactory = require('./layer-analysis-view-factory');
var LayerAnalysesView = require('./layer-analyses-view');
var AddAnalysisView = require('../../components/modals/add-analysis/add-analysis-view');
var template = require('./layers.tpl');

require('jquery-ui/sortable');

var DefaultLayerView = require('./layer-view');
var BasemapLayerView = require('./basemap-layer-view');

/**
 * View to render layer definitions list
 */
module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.stackLayoutModel) throw new Error('stackLayoutModel is required');
    if (!opts.analysis) throw new Error('analysis is required');
    if (!opts.modals) throw new Error('modals is required');
    if (!opts.analysisDefinitionNodesCollection) throw new Error('analysisDefinitionNodesCollection is required');
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.editorModel) throw new Error('editorModel is required');

    this._modals = opts.modals;
    this._configModel = opts.configModel;
    this._editorModel = opts.editorModel;
    this._stackLayoutModel = opts.stackLayoutModel;
    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._userModel = opts.userModel;

    this._layerAnalysisViewFactory = new LayerAnalysisViewFactory(opts.analysisDefinitionNodesCollection, opts.analysis);

    this.listenTo(this._layerDefinitionsCollection, 'add', this.render);
    this.add_related_model(this._layerDefinitionsCollection);
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(template);

    _.each(this._layerDefinitionsCollection.toArray().reverse(), this._addLayerView, this);

    return this;
  },

  _addLayerView: function (m) {
    var view;

    if (m.get('type') === 'Tiled') {
      view = new BasemapLayerView({
        model: m
      });
    } else {
      view = new DefaultLayerView({
        model: m,
        newAnalysesView: this._newAnalysesView.bind(this),
        openAddAnalysis: this._openAddAnalysis.bind(this),
        stackLayoutModel: this._stackLayoutModel
      });
    }

    view.$el.data('layerId', m.id);

    this.addView(view);
    this.$('.js-layers').append(view.render().el);

    this._initSortable();
  },

  _initSortable: function () {
    this.$('.js-layers').sortable({
      axis: 'y',
      items: '.js-layer.js-sortable',
      placeholder: 'Editor-ListLayer-item Editor-ListLayer-item--placeholder',
      forcePlaceholderSize: true,
      containment: 'parent',
      update: this._onOrderOfLayersChanged.bind(this)
    });
  },

  _onOrderOfLayersChanged: function (event, ui) {
    var $draggedLayerElement = this.$(ui.item);
    var layerId = $draggedLayerElement.data('layerId');
    var layerDefinitionModel = this._layerDefinitionsCollection.get(layerId);
    var numberOfLayers = $draggedLayerElement.parent().children('.js-layer').length;
    var previousPosition = layerDefinitionModel.get('order');
    var newPosition = numberOfLayers - $draggedLayerElement.index() - 1;

    this._layerDefinitionsCollection.moveLayer({
      from: previousPosition,
      to: newPosition
    });
  },

  _destroySortable: function () {
    if (this.$('.js-layers').data('ui-sortable')) {
      this.$('.js-layers').sortable('destroy');
    }
  },

  /**
   * As defined by default-layer-view
   */
  _newAnalysesView: function (el, layerDefinitionModel) {
    return new LayerAnalysesView({
      el: el,
      model: layerDefinitionModel,
      layerAnalysisViewFactory: this._layerAnalysisViewFactory
    });
  },

  _openAddAnalysis: function (layerDefinitionModel) {
    var self = this;

    this._modals.create(function (modalModel) {
      modalModel.once('destroy', function (nodeModel) {
        this._onNodeCreated(layerDefinitionModel, nodeModel);
      }, self);
      return new AddAnalysisView({
        modalModel: modalModel,
        layerDefinitionModel: layerDefinitionModel
      });
    });
  },

  _onNodeCreated: function (layerDefinitionModel, nodeModel) {
    if (nodeModel && !nodeModel.isValid()) {
      this._stackLayoutModel.nextStep(layerDefinitionModel, 'layers', nodeModel);
    }
  },

  clean: function () {
    this._destroySortable();
    cdb.core.View.prototype.clean.apply(this);
  }
});
