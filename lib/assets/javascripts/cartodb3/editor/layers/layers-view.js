var _ = require('underscore');
var $ = require('jquery');
var CoreView = require('backbone/core-view');
var LayerAnalysisViewFactory = require('./layer-analysis-view-factory');
var LayerAnalysesView = require('./layer-analyses-view');
var template = require('./layers.tpl');

require('jquery-ui');

var DefaultLayerView = require('./layer-view');
var BasemapLayerView = require('./basemap-layer-view');

var SORTABLE_SELECTOR = '.js-layers';
var SORTABLE_ITEMS_SELECTOR = '.js-layer.js-sortable-item';

/**
 * View to render layer definitions list
 */
module.exports = CoreView.extend({

  events: {
    'click .js-analysis-node': '_onAnalysisNodeClicked'
  },

  initialize: function (opts) {
    if (!opts.stackLayoutModel) throw new Error('stackLayoutModel is required');
    if (!opts.analysis) throw new Error('analysis is required');
    if (!opts.analysisDefinitionNodesCollection) throw new Error('analysisDefinitionNodesCollection is required');
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.editorModel) throw new Error('editorModel is required');

    this._configModel = opts.configModel;
    this._editorModel = opts.editorModel;
    this._stackLayoutModel = opts.stackLayoutModel;
    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._userModel = opts.userModel;
    this._analysisDefinitionNodesCollection = opts.analysisDefinitionNodesCollection;

    this._layerAnalysisViewFactory = new LayerAnalysisViewFactory(this._analysisDefinitionNodesCollection, opts.analysis);

    this.listenTo(this._layerDefinitionsCollection, 'add change:id', this.render);
    this.add_related_model(this._layerDefinitionsCollection);
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template);

    _.each(this._layerDefinitionsCollection.toArray().reverse(), this._addLayerView, this);
    this._initSortable();

    return this;
  },

  _addLayerView: function (m) {
    var view;

    if (m.get('type') === 'Tiled' || m.get('type') === 'Plain') {
      view = new BasemapLayerView({
        model: m,
        stackLayoutModel: this._stackLayoutModel
      });
    } else {
      view = new DefaultLayerView({
        model: m,
        layerDefinitionsCollection: this._layerDefinitionsCollection,
        newAnalysesView: this._newAnalysesView.bind(this),
        stackLayoutModel: this._stackLayoutModel
      });
    }

    view.$el.data('layerId', m.id);

    this.addView(view);
    this.$(SORTABLE_SELECTOR).append(view.render().el);
  },

  _initSortable: function () {
    this.$(SORTABLE_SELECTOR).sortable({
      axis: 'y',
      items: SORTABLE_ITEMS_SELECTOR,
      placeholder: 'Editor-ListLayer-item Editor-ListLayer-item--placeholder',
      forcePlaceholderSize: true,
      cancel: '.js-title',
      start: this._preventPlaceholderAfterBasemap.bind(this),
      beforeStop: this._dontAllowToMoveItemAfterBasemap.bind(this),
      update: this._onSortableUpdate.bind(this)
    });
  },

  _preventPlaceholderAfterBasemap: function (evt, ui) {
    var $placeholder = $(ui.placeholder);
    if ($placeholder.is(':last-child')) {
      $placeholder.remove();
      return;
    }
  },

  _dontAllowToMoveItemAfterBasemap: function (evt, ui) {
    this._stopUpdate = $(ui.placeholder).is(':last-child');
  },

  _onSortableUpdate: function (event, ui) {
    if (this._stopUpdate) {
      this.$(SORTABLE_SELECTOR).sortable('cancel');
      this._stopUpdate = false;
      return;
    }

    var $draggedLayerElement = ui.item;
    var numberOfLayers = $draggedLayerElement.parent().children('.js-layer').length;
    var newPosition = numberOfLayers - $draggedLayerElement.index();

    var layerId = $draggedLayerElement.data('layerId');
    if (layerId) {
      var layerDefinitionModel = this._layerDefinitionsCollection.get(layerId);
      this._layerDefinitionsCollection.moveLayer({
        from: layerDefinitionModel.get('order'),
        to: newPosition - 1 // -1 to compensate for the move of dragged-element
      });
      return;
    }

    var analysisNodeId = $draggedLayerElement.data('analysis-node-id');
    if (analysisNodeId) {
      this._layerDefinitionsCollection.createLayerForAnalysisNode(analysisNodeId, newPosition);
    }
  },

  _destroySortable: function () {
    if (this.$(SORTABLE_SELECTOR).data('ui-sortable')) {
      this.$(SORTABLE_SELECTOR).sortable('destroy');
    }
  },

  /**
   * As defined by default-layer-view
   */
  _newAnalysesView: function (el, layerDefinitionModel) {
    return new LayerAnalysesView({
      el: el,
      sortableSelector: SORTABLE_SELECTOR,
      model: layerDefinitionModel,
      layerAnalysisViewFactory: this._layerAnalysisViewFactory
    });
  },

  _onAnalysisNodeClicked: function (ev) {
    var nodeId = ev.currentTarget && ev.currentTarget.dataset.analysisNodeId;
    if (!nodeId) throw new Error('missing data-analysis-node-id on element to edit analysis node, the element was: ' + ev.currentTarget.outerHTML);

    var nodeDefModel = this._analysisDefinitionNodesCollection.get(nodeId);
    var layerDefModel = this._layerDefinitionsCollection.findOwnerOfAnalysisNode(nodeDefModel);
    if (!layerDefModel) throw new Error('no owning layer found for node ' + nodeId);

    this._stackLayoutModel.nextStep(layerDefModel, 'layer-content', nodeId);
  },

  clean: function () {
    this._destroySortable();
    CoreView.prototype.clean.apply(this);
  }
});
