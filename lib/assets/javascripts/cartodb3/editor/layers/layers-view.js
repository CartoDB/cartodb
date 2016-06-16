var _ = require('underscore');
var CoreView = require('backbone/core-view');
var template = require('./layers.tpl');
var layerTypesAndKinds = require('../../data/layer-types-and-kinds');
var LayerViewFactory = require('./layer-view-factory');
require('jquery-ui/sortable');

/**
 * View to render layer definitions list
 */
module.exports = CoreView.extend({

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

    this._layerViewFactory = new LayerViewFactory({
      stackLayoutModel: this._stackLayoutModel,
      layerDefinitionsCollection: this._layerDefinitionsCollection,
      analysisDefinitionNodesCollection: opts.analysisDefinitionNodesCollection,
      analysis: opts.analysis
    });

    this.listenTo(this._layerDefinitionsCollection, 'add', this.render);
    // TODO: ?
    // this.listenTo(this._layerDefinitionsCollection, 'remove', this.render);
    this.add_related_model(this._layerDefinitionsCollection);
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(template);

    _.each(this._layerDefinitionsCollection.toArray().reverse(), this._addLayerView, this);

    return this;
  },

  _addLayerView: function (m) {
    var view = this._layerViewFactory.createLayerView(m);
    view.$el.data('layerId', m.id);
    this.addView(view);
    this.$('.js-layers').append(view.render().el);

    this._initSortable();
  },

  _isBaseLayer: function (layerDefinitionModel) {
    return this._layerDefinitionsCollection.first() === layerDefinitionModel;
  },

  _isLabelsLayer: function (layerDefinitionModel) {
    return layerTypesAndKinds.isTiledType(layerDefinitionModel.get('type')) &&
      layerDefinitionModel === this._layerDefinitionsCollection.last();
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

  clean: function () {
    this._destroySortable();
    CoreView.prototype.clean.apply(this);
  }
});
