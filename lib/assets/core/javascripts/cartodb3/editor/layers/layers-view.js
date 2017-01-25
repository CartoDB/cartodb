var _ = require('underscore');
var $ = require('jquery');
var CoreView = require('backbone/core-view');
var Notifier = require('../../components/notifier/notifier');
var template = require('./layers.tpl');
var LayerViewFactory = require('./layer-view-factory');
require('jquery-ui');

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
    if (!opts.analysisDefinitionNodesCollection) throw new Error('analysisDefinitionNodesCollection is required');
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.modals) throw new Error('modals is required');
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.editorModel) throw new Error('editorModel is required');
    if (!opts.userActions) throw new Error('userActions is required');
    if (!opts.stateDefinitionModel) throw new Error('stateDefinitionModel is required');

    this._configModel = opts.configModel;
    this._editorModel = opts.editorModel;
    this._stackLayoutModel = opts.stackLayoutModel;
    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._userModel = opts.userModel;
    this._analysisDefinitionNodesCollection = opts.analysisDefinitionNodesCollection;
    this._userActions = opts.userActions;
    this._stateDefinitionModel = opts.stateDefinitionModel;

    this._layerViewFactory = new LayerViewFactory({
      stackLayoutModel: this._stackLayoutModel,
      userActions: this._userActions,
      layerDefinitionsCollection: this._layerDefinitionsCollection,
      analysisDefinitionNodesCollection: opts.analysisDefinitionNodesCollection,
      modals: opts.modals,
      configModel: opts.configModel,
      sortableSelector: SORTABLE_SELECTOR,
      stateDefinitionModel: this._stateDefinitionModel
    });

    this.listenTo(this._layerDefinitionsCollection, 'add remove change:id', this.render);
    this.listenTo(this._layerDefinitionsCollection, 'add', this._createNotification);
    this.add_related_model(this._layerDefinitionsCollection);
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template);

    _.each(this._layerDefinitionsCollection.toArray().reverse(), this._addLayerView, this);
    this._initSortable();

    return this;
  },

  _createNotification: function (m) {
    Notifier.addNotification({
      status: 'success',
      info: _t('notifications.layer.added', {
        name: m.getName()
      }),
      closable: true,
      delay: Notifier.DEFAULT_DELAY
    });
  },

  _addLayerView: function (m) {
    var view = this._layerViewFactory.createLayerView(m);
    view.$el.data('layerId', m.id);
    this.addView(view);
    this.$(SORTABLE_SELECTOR).append(view.render().el);
  },

  _initSortable: function () {
    this.$(SORTABLE_SELECTOR).sortable({
      axis: 'y',
      items: SORTABLE_ITEMS_SELECTOR,
      placeholder: 'Editor-ListLayer-item Editor-ListLayer-item--placeholder',
      containment: SORTABLE_SELECTOR,
      forceHelperSize: true,
      forcePlaceholderSize: true,
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
      this._userActions.moveLayer({
        from: layerDefinitionModel.get('order'),
        to: newPosition - 1 // -1 to compensate for the move of dragged-element
      });
      return;
    }

    var analysisNodeId = $draggedLayerElement.data('analysis-node-id');
    if (analysisNodeId) {
      try {
        this._userActions.createLayerForAnalysisNode(analysisNodeId, {at: newPosition});
      } catch (err) {
        if (/max/.test(err.message)) {
          $draggedLayerElement.remove();
          Notifier.addNotification({
            status: 'warning',
            info: _t('editor.layers.drag-n-drop-analysis.upgrade-max-layers-err', {
              a_start: '<a href="https://carto.com/pricing/">',
              a_end: '</a>',
              userMaxLayers: err.userMaxLayers
            }),
            closable: true,
            delay: Notifier.DEFAULT_DELAY
          });
        } else {
          throw err; // unknown err, let it bubble up
        }
      }
    }
  },

  _destroySortable: function () {
    if (this.$(SORTABLE_SELECTOR).data('ui-sortable')) {
      this.$(SORTABLE_SELECTOR).sortable('destroy');
    }
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
