require('jquery-ui');
var _ = require('underscore');
var $ = require('jquery');
var CoreView = require('backbone/core-view');
var Notifier = require('builder/components/notifier/notifier');
var template = require('./layers.tpl');
var LayerViewFactory = require('./layer-view-factory');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var TipsyTooltipView = require('builder/components/tipsy-tooltip-view');
var AddLayerView = require('builder/components/modals/add-layer/add-layer-view');
var AddLayerModel = require('builder/components/modals/add-layer/add-layer-model');

var SORTABLE_SELECTOR = '.js-layers';
var SORTABLE_ITEMS_SELECTOR = '.js-layer.js-sortable-item';

var REQUIRED_OPTS = [
  'analysisDefinitionNodesCollection',
  'layerDefinitionsCollection',
  'modals',
  'userModel',
  'configModel',
  'pollingModel',
  'editorModel',
  'userActions',
  'stateDefinitionModel',
  'visDefinitionModel',
  'widgetDefinitionsCollection',
  'showMaxLayerError'
];

/**
 * View to render layer definitions list
 */
module.exports = CoreView.extend({

  events: {
    'click .js-add': '_addLayer'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._layerViewFactory = new LayerViewFactory({
      userActions: this._userActions,
      layerDefinitionsCollection: this._layerDefinitionsCollection,
      analysisDefinitionNodesCollection: opts.analysisDefinitionNodesCollection,
      modals: opts.modals,
      configModel: opts.configModel,
      sortableSelector: SORTABLE_SELECTOR,
      stateDefinitionModel: this._stateDefinitionModel,
      visDefinitionModel: this._visDefinitionModel,
      widgetDefinitionsCollection: this._widgetDefinitionsCollection
    });

    this._initBinds();
  },

  _initBinds: function () {
    this.listenTo(this._layerDefinitionsCollection, 'add remove change:id', this.render);
    this.listenTo(this._layerDefinitionsCollection, 'reset', this._updateAddButtonState);
    this.listenTo(this._layerDefinitionsCollection, 'add', this._createNotification);
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template);

    _.each(this._layerDefinitionsCollection.toArray().reverse(), this._addLayerView, this);
    this._initSortable();
    this._updateAddButtonState();
    this._initViews();

    return this;
  },

  _initViews: function () {
    var tooltip = new TipsyTooltipView({
      el: this.$('.js-add'),
      gravity: 'w',
      title: function () {
        return this._tooltipTitle;
      }.bind(this),
      offset: 8
    });
    this.addView(tooltip);
  },

  _addLayer: function () {
    if (this.$('.js-add').hasClass('is-disabled')) return;

    var self = this;
    var modal = this._modals.create(function (modalModel) {
      var addLayerModel = new AddLayerModel({}, {
        userModel: self._userModel,
        userActions: self._userActions,
        configModel: self._configModel,
        pollingModel: self._pollingModel
      });

      return new AddLayerView({
        modalModel: modalModel,
        configModel: self._configModel,
        userModel: self._userModel,
        createModel: addLayerModel,
        pollingModel: self._pollingModel
      });
    });
    modal.show();
  },

  _createNotification: function (layerDefinitionModel) {
    var LAYER_ADDED_NOTIFICATION = 'layer-added';
    var notification = Notifier.getNotification(LAYER_ADDED_NOTIFICATION);

    var notificationAttrs = {
      status: 'success',
      info: _t('notifications.layer.added'),
      closable: true,
      delay: Notifier.DEFAULT_DELAY
    };

    if (notification) {
      notification.set(notificationAttrs);
    } else {
      Notifier.addNotification(_.extend(notificationAttrs, {
        id: LAYER_ADDED_NOTIFICATION
      }));
    }
  },

  _addLayerView: function (model) {
    if (this._layerViewFactory.isLabelsLayer(model)) {
      return;
    }

    var view = this._layerViewFactory.createLayerView(model);
    view.$el.data('layerId', model.id);
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

  _getDataLayerCount: function () {
    return this._layerDefinitionsCollection.getNumberOfDataLayers();
  },

  _getMaxCount: function () {
    return this._userModel.get('limits').max_layers;
  },

  _updateAddButtonState: function () {
    var count = this._getDataLayerCount();
    var max = this._getMaxCount();

    if (count === max) {
      this._disableAddButton();
      this._tooltipTitle = _t('editor.layers.max-layers-infowindow.title');
    } else {
      this._enableAddButton();
      this._tooltipTitle = _t('editor.layers.add-layer.tooltip');
    }
  },

  _enableAddButton: function () {
    this.$('.js-add').removeClass('is-disabled');
  },

  _disableAddButton: function () {
    this.$('.js-add').addClass('is-disabled');
  },

  _preventPlaceholderAfterBasemap: function (evt, ui) {
    var $placeholder = $(ui.placeholder);
    if ($placeholder.is(':last-child')) {
      $placeholder.remove();
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
    var fromLayerLetter = $draggedLayerElement.data('layer-letter');
    if (analysisNodeId) {
      try {
        this._userActions.createLayerForAnalysisNode(analysisNodeId, fromLayerLetter, {at: newPosition});
      } catch (err) {
        if (/max/.test(err.message)) {
          $draggedLayerElement.remove();
          this._showMaxLayerError();
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

  clean: function () {
    this._destroySortable();
    CoreView.prototype.clean.apply(this);
  }
});
