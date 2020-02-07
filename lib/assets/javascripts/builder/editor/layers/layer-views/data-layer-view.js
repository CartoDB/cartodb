var Backbone = require('backbone');
var _ = require('underscore');
var CoreView = require('backbone/core-view');
var template = require('./data-layer.tpl');
var fetchingTemplate = require('./data-layer-fetching.tpl');
var ContextMenuView = require('builder/components/context-menu/context-menu-view');
var CustomListCollection = require('builder/components/custom-list/custom-list-collection');
var renameLayer = require('builder/editor/layers/operations/rename-layer');
var DeleteLayerConfirmationView = require('builder/components/modals/remove-layer/delete-layer-confirmation-view');
var ModalExportDataView = require('builder/components/modals/export-data/modal-export-data-view');
var InlineEditorView = require('builder/components/inline-editor/inline-editor-view');
var TipsyTooltipView = require('builder/components/tipsy-tooltip-view');
var zoomToData = require('builder/editor/map-operations/zoom-to-data');
var templateInlineEditor = require('./inline-editor.tpl');
var geometryNoneTemplate = require('./geometry-none.tpl');
var geometryPointsTemplate = require('./geometry-points.tpl');
var geometryLinesTemplate = require('./geometry-lines.tpl');
var geometryPolygonsTemplate = require('./geometry-polygons.tpl');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var fetchAllQueryObjects = require('builder/helpers/fetch-all-query-objects');
var Router = require('builder/routes/router');
var IconView = require('builder/components/icon/icon-view');
var STATES = require('builder/data/query-base-status');
const { nodeHasTradeArea, nodeHasSQLFunction } = require('builder/helpers/analysis-node-utils');

var REQUIRED_OPTS = [
  'userActions',
  'layerDefinitionsCollection',
  'modals',
  'configModel',
  'stateDefinitionModel',
  'widgetDefinitionsCollection',
  'visDefinitionModel',
  'analysisDefinitionNodesCollection'
];

module.exports = CoreView.extend({
  module: 'editor:layers:layer-views:data-layer-view',

  tagName: 'li',

  className: 'Editor-ListLayer-item js-layer',

  events: {
    'click': '_onEditLayer',
    'click .js-base': '_onClickSource',
    'click .js-title': '_onClickTitle',
    'click .js-toggle-menu': '_onToggleContextMenuClicked',
    'click .js-toggle': '_onToggleLayerClicked',
    'click .js-analysis-node': '_onAnalysisNodeClicked'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    if (!_.isFunction(opts.newAnalysesView)) throw new Error('newAnalysesView is required as a function');

    this._newAnalysesView = opts.newAnalysesView;
    this._styleModel = this.model.styleModel;

    var nodeDefModel = this.model.getAnalysisDefinitionNodeModel();

    this._queryGeometryModel = nodeDefModel.queryGeometryModel;
    this._queryRowsStatus = nodeDefModel.queryRowsCollection.statusModel;

    this._initViewState();
    this._bindEvents();

    fetchAllQueryObjects({
      queryRowsCollection: nodeDefModel.queryRowsCollection,
      queryGeometryModel: this._queryGeometryModel,
      querySchemaModel: nodeDefModel.querySchemaModel
    }).then(function () {
      this.model.fetchQueryRowsIfRequired();
      this._setViewState();
    }.bind(this));
  },

  render: function () {
    this.clearSubViews();

    var isAnimation = this._styleModel.isAnimation();
    var fetching = this._viewState.get('isFetchingRows');

    if (fetching) {
      this.$el.html(fetchingTemplate());
      this.$el.addClass('Editor-ListLayer-item--fetching');
      return this;
    } else {
      this.$el.removeClass('Editor-ListLayer-item--fetching');
    }

    this.$el.html(template({
      layerId: this.model.id,
      title: this.model.getName(),
      color: this.model.getColor(),
      isVisible: this.model.get('visible'),
      isAnimated: isAnimation,
      isTorque: this._isTorque(),
      hasError: this._hasError(),
      isCollapsed: this._isCollapsed(),
      numberOfAnalyses: this.model.getNumberOfAnalyses(),
      numberOfWidgets: this._widgetDefinitionsCollection.widgetsOwnedByLayer(this.model.id),
      needsGeocoding: this._viewState.get('needsGeocoding'),
      hasGeom: this._viewState.get('queryGeometryHasGeom'),
      isEmpty: this._viewState.get('isLayerEmpty'),
      brokenLayer: false
    }));

    this._initViews();

    return this;
  },

  _initViewState: function () {
    this._viewState = new Backbone.Model({
      needsGeocoding: false,
      isLayerEmpty: false,
      queryGeometryHasGeom: true,
      isFetchingRows: false
    });
    this._setViewState();
  },

  _isTorque: function () {
    return this.model.isTorqueLayer();
  },

  _initViews: function () {
    var geometryTemplate = this._getGeometryTemplate(this._queryGeometryModel.get('simple_geom'));

    this._inlineEditor = new InlineEditorView({
      template: templateInlineEditor,
      renderOptions: {
        title: this.model.getName()
      },
      onClick: this._onEditLayer.bind(this),
      onEdit: this._renameLayer.bind(this)
    });
    this.addView(this._inlineEditor);

    this.$('.js-thumbnail').append(geometryTemplate({
      letter: this.model.get('letter')
    }));
    this.$('.js-header').html(this._inlineEditor.render().el);

    this.$el.toggleClass('is-unavailable', this.model.isNew());
    this.$el.toggleClass('js-sortable-item', !this._isTorque());
    this.$el.toggleClass('is-animated', this._isTorque());
    this.$el.toggleClass('is-empty', this._viewState.get('needsGeocoding'));
    this.$('.js-thumbnail').toggleClass('is-hidden', this._isHidden());
    this.$('.js-title').toggleClass('is-hidden', this._isHidden());
    this.$('.js-analyses-widgets-info').toggleClass('is-hidden', this._isHidden());

    if (this._isTorque()) {
      var torqueTooltip = new TipsyTooltipView({
        el: this.$('.js-torqueIcon'),
        gravity: 's',
        offset: 0
      });
      this.addView(torqueTooltip);
    }

    if (this._viewState.get('needsGeocoding')) {
      var georeferenceTooltip = new TipsyTooltipView({
        el: this.$('.js-geocode'),
        gravity: 'w',
        offset: 0
      });
      this.addView(georeferenceTooltip);
    }

    if (this._viewState.get('isLayerEmpty')) {
      var warningIcon = new IconView({
        placeholder: this.$el.find('.js-emptylayer'),
        icon: 'warning'
      });
      warningIcon.render();
      this.addView(warningIcon);

      var emptyLayerTooltip = new TipsyTooltipView({
        el: this.$el.find('.js-emptylayer'),
        gravity: 'w',
        title: function () {
          return _t('editor.layers.layer.empty-layer');
        }
      });
      this.addView(emptyLayerTooltip);
    }

    this._toggleClickEventsOnCapturePhase('remove'); // remove any if rendered previously
    if (this.model.isNew()) {
      this._toggleClickEventsOnCapturePhase('add');
    }

    if (this.model.get('source')) {
      var analysesView = this._newAnalysesView(this.$('.js-analyses'), this.model);
      this.addView(analysesView);
      analysesView.render();
    }

    if (this._hasError()) {
      var errorTooltip = new TipsyTooltipView({
        el: this.$('.js-error'),
        gravity: 's',
        offset: 0,
        title: function () {
          return this.model.get('error') && this.model.get('error').message;
        }.bind(this)
      });
      this.addView(errorTooltip);
    }

    var toggleTooltip = new TipsyTooltipView({
      el: this.$('.js-toggle-menu'),
      gravity: 'w',
      title: function () {
        return _t('more-options');
      }
    });
    this.addView(toggleTooltip);

    var toggleMenuTooltip = new TipsyTooltipView({
      el: this.$('.js-toggle'),
      gravity: 's',
      title: function () {
        return this._isHidden() ? _t('editor.layers.options.show') : _t('editor.layers.options.hide');
      }.bind(this)
    });
    this.addView(toggleMenuTooltip);
  },

  _bindEvents: function () {
    this.listenTo(this.model, 'change', this.render);
    this.listenToOnce(this.model, 'destroy', this._onDestroy);
    this.listenTo(this._queryGeometryModel, 'change:simple_geom', this._setViewState);
    this.listenTo(this._queryRowsStatus, 'change:status', this._onQueryRowsStatusChanged);
    this.listenTo(this._viewState, 'change', this.render);
  },

  _getGeometryTemplate: function (geometry) {
    switch (geometry) {
      case 'line':
        return geometryLinesTemplate;
      case 'point':
        return geometryPointsTemplate;
      case 'polygon':
        return geometryPolygonsTemplate;
      default:
        return geometryNoneTemplate;
    }
  },

  _isHidden: function () {
    return !this.model.get('visible');
  },

  _hasError: function () {
    return !!this.model.get('error');
  },

  _isCollapsed: function () {
    return !!this.model.get('collapsed');
  },

  _onClickTitle: function (event) {
    // event is handled with inlineEditor
    event.stopPropagation();
  },

  _onAnalysisNodeClicked: function (event) {
    event.stopPropagation();

    var nodeId = event.currentTarget && event.currentTarget.dataset.analysisNodeId;
    if (!nodeId) throw new Error('missing data-analysis-node-id on element to edit analysis node, the element was: ' + event.currentTarget.outerHTML);

    var nodeDefModel = this._analysisDefinitionNodesCollection.get(nodeId);
    var layerDefModel = this._layerDefinitionsCollection.findOwnerOfAnalysisNode(nodeDefModel);
    if (!layerDefModel) throw new Error('no owning layer found for node ' + nodeId);

    Router.goToAnalysisNode(this.model.get('id'), nodeId);
  },

  _onClickSource: function (event) {
    event.stopPropagation();

    Router.goToDataTab(this.model.get('id'));
  },

  _onEditLayer: function (event) {
    event && event.stopPropagation();

    var self = this;
    this.model.canBeGeoreferenced()
      .then(function (canBeGeoreferenced) {
        if (canBeGeoreferenced) {
          Router.goToAnalysisTab(self.model.get('id'));
        }
      });
    Router.goToStyleTab(self.model.get('id')); // Speculative execution. We bet on not needing geocoding to give quick feedback to the user.
  },

  _onToggleCollapsedLayer: function () {
    this.model.toggleCollapse();
  },

  _onToggleLayerClicked: function (event) {
    event.stopPropagation();

    var savingOptions = {
      shouldPreserveAutoStyle: true
    };

    this.model.toggleVisible();
    this._userActions.saveLayer(this.model, savingOptions);
  },

  _onToggleContextMenuClicked: function (event) {
    event.stopPropagation();

    if (this._hasContextMenu()) {
      this._hideContextMenu();
    } else {
      this._showContextMenu({
        x: event.pageX,
        y: event.pageY
      });
    }
  },

  _hasContextMenu: function () {
    return this._menuView;
  },

  _hideContextMenu: function () {
    this.removeView(this._menuView);
    this._menuView.clean();
    delete this._menuView;
  },

  _getContextMenuOptions: function () {
    var menuItems = [{
      label: _t('editor.layers.options.edit'),
      val: 'edit-layer',
      action: this._onEditLayer.bind(this)
    }];

    if (!this._viewState.get('needsGeocoding')) {
      menuItems = menuItems.concat([{
        label: this._isCollapsed() ? _t('editor.layers.options.expand') : _t('editor.layers.options.collapse'),
        val: 'collapse-expand-layer',
        action: this._onToggleCollapsedLayer.bind(this)
      }, {
        label: _t('editor.layers.options.rename'),
        val: 'rename-layer',
        action: function () {
          this._inlineEditor.edit();
        }.bind(this)
      }]);

      if (!this._viewState.get('isLayerEmpty')) {
        menuItems = menuItems.concat([
          {
            label: _t('editor.layers.options.export'),
            val: 'export-data',
            action: this._exportLayer.bind(this)
          },
          {
            label: _t('editor.layers.options.center-map'),
            val: 'center-map',
            action: this._centerMap.bind(this)
          }
        ]);
      }
    }

    if (this.model.canBeDeletedByUser()) {
      menuItems.push({
        label: _t('editor.layers.options.delete'),
        val: 'delete-layer',
        action: this._confirmDeleteLayer.bind(this),
        destructive: true
      });
    }

    return menuItems;
  },

  _showContextMenu: function (position) {
    var menuItems = new CustomListCollection(this._getContextMenuOptions());
    var triggerElementID = 'context-menu-trigger-' + this.model.cid;
    this.$('.js-toggle-menu').attr('id', triggerElementID);
    this._menuView = new ContextMenuView({
      collection: menuItems,
      triggerElementID: triggerElementID,
      position: position
    });

    menuItems.bind('change:selected', function (menuItem) {
      menuItem.has('action') && menuItem.get('action')();
    }, this);

    this._menuView.model.bind('change:visible', function (model, isContextMenuVisible) {
      if (this._hasContextMenu() && !isContextMenuVisible) {
        this._hideContextMenu();
      }
    }, this);

    this._menuView.show();
    this.addView(this._menuView);
  },

  _exportLayer: function () {
    var nodeDefModel = this.model.getAnalysisDefinitionNodeModel();
    const { queryGeometryModel, querySchemaModel } = nodeDefModel;
    const canHideColumns = nodeHasTradeArea(nodeDefModel) &&
      !nodeHasSQLFunction(nodeDefModel);

    this._modals.create(function (modalModel) {
      return new ModalExportDataView({
        fromView: 'main',
        modalModel: modalModel,
        queryGeometryModel,
        querySchemaModel,
        canHideColumns,
        configModel: this._configModel,
        layerModel: this.model,
        filename: this.model.getName()
      });
    }.bind(this));
  },

  _confirmDeleteLayer: function () {
    this._modals.create(function (modalModel) {
      var deleteLayerConfirmationView = new DeleteLayerConfirmationView({
        userActions: this._userActions,
        modals: this._modals,
        layerModel: this.model,
        modalModel: modalModel,
        visDefinitionModel: this._visDefinitionModel,
        widgetDefinitionsCollection: this._widgetDefinitionsCollection
      });

      return deleteLayerConfirmationView;
    }.bind(this));
  },

  _renameLayer: function () {
    var newName = this._inlineEditor.getValue();

    if (newName !== '') {
      // Optimistic
      this._onSaveSuccess(newName);

      renameLayer({
        newName: newName,
        userActions: this._userActions,
        layerDefinitionsCollection: this._layerDefinitionsCollection,
        layerDefinitionModel: this.model,
        onError: this._onSaveError.bind(this)
      });
    }
  },

  _onSaveSuccess: function (newName) {
    this.$('.js-title').text(newName).show();
    this._inlineEditor.hide();
  },

  _onSaveError: function (oldName) {
    this.$('.js-title').text(oldName).show();
    this._inlineEditor.hide();
  },

  _onDestroy: function () {
    this.clean();
  },

  _disableEventsOnCapturePhase: function (evt) {
    evt.stopPropagation();
    evt.preventDefault();
  },

  _toggleClickEventsOnCapturePhase: function (str) {
    var addOrRemove = str === 'add'
      ? 'add'
      : 'remove';
    this.el[addOrRemove + 'EventListener']('click', this._disableEventsOnCapturePhase, true);
  },

  _centerMap: function () {
    var nodeModel = this.model.getAnalysisDefinitionNodeModel();
    var query = nodeModel.querySchemaModel.get('query');
    zoomToData(this._configModel, this._stateDefinitionModel, query);
  },

  _isFetchingRows: function () {
    var nodeDefModel = this.model.getAnalysisDefinitionNodeModel();
    var queryRowsStatus = nodeDefModel.queryRowsCollection.statusModel;
    return queryRowsStatus.get('status') === STATES.fetching;
  },

  _onQueryRowsStatusChanged: function () {
    this._viewState.set('isFetchingRows', this._isFetchingRows());
    this._setViewState();
  },

  _setViewState: function () {
    var self = this;
    var georeferencePromise = this.model.canBeGeoreferenced();
    var isLayerEmptyPromise = this.model.isEmptyAsync();
    var hasGeomPromise = this._queryGeometryModel.hasValueAsync();

    Promise.all([georeferencePromise, isLayerEmptyPromise, hasGeomPromise])
      .then(function (values) {
        self._viewState.set({
          needsGeocoding: values[0],
          isLayerEmpty: values[1],
          queryGeometryHasGeom: values[2],
          isFetchingRows: self._isFetchingRows()
        });
      });
  },

  clean: function () {
    this._toggleClickEventsOnCapturePhase('remove');
    CoreView.prototype.clean.apply(this);
  }
});
