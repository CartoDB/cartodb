var _ = require('underscore');
var $ = require('jquery');
var CoreView = require('backbone/core-view');
var template = require('./data-layer.tpl');
var fetchingTemplate = require('./data-layer-fetching.tpl');
var AnalysesService = require('../layer-content-views/analyses/analyses-service');
var ContextMenuView = require('../../../components/context-menu/context-menu-view');
var CustomListCollection = require('../../../components/custom-list/custom-list-collection');
var renameLayer = require('../operations/rename-layer');
var DeleteLayerConfirmationView = require('../../../components/modals/remove-layer/delete-layer-confirmation-view');
var ModalExportDataView = require('../../../components/modals/export-data/modal-export-data-view');
var InlineEditorView = require('../../../components/inline-editor/inline-editor-view');
var TipsyTooltipView = require('../../../components/tipsy-tooltip-view');
var zoomToData = require('../../map-operations/zoom-to-data');
var templateInlineEditor = require('./inline-editor.tpl');
var geometryNoneTemplate = require('./geometry-none.tpl');
var geometryPointsTemplate = require('./geometry-points.tpl');
var geometryLinesTemplate = require('./geometry-lines.tpl');
var geometryPolygonsTemplate = require('./geometry-polygons.tpl');
var checkAndBuildOpts = require('../../../helpers/required-opts');

var REQUIRED_OPTS = [
  'userActions',
  'stackLayoutModel',
  'layerDefinitionsCollection',
  'modals',
  'configModel',
  'stateDefinitionModel',
  'widgetDefinitionsCollection',
  'visDefinitionModel',
  'analysisDefinitionNodesCollection'
];

module.exports = CoreView.extend({

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

    this._bindEvents();

    if (this._queryGeometryModel.shouldFetch()) {
      this._queryGeometryModel.fetch();
    }

    this.model.fetchQueryRowsIfRequired();
  },

  render: function () {
    this.clearSubViews();

    var isAnimation = this._styleModel.isAnimation();
    var fetching = this._queryRowsStatus.get('status') === 'fetching';

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
      needsGeocoding: this._needsGeocoding(),
      hasGeom: this._queryGeometryHasGeom(),
      brokenLayer: false
    }));

    this._initViews();

    return this;
  },

  _isTorque: function () {
    return this.model.isTorqueLayer();
  },

  _needsGeocoding: function () {
    return this.model.canBeGeoreferenced();
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
    this.$el.toggleClass('is-empty', this._needsGeocoding());
    this.$('.js-thumbnail').toggleClass('is-hidden', this._isHidden());
    this.$('.js-title').toggleClass('is-hidden', this._isHidden());
    this.$('.js-analyses-widgets-info').toggleClass('is-hidden', this._isHidden());

    if (this._isTorque()) {
      var torqueTooltip = new TipsyTooltipView({
        el: this.$('.js-torqueIcon'),
        gravity: 's',
        offset: 0,
        title: function () {
          return $(this).data('tooltip');
        }
      });
      this.addView(torqueTooltip);
    }

    if (this._needsGeocoding()) {
      var georeferenceTooltip = new TipsyTooltipView({
        el: this.$('.js-geocode'),
        gravity: 'w',
        offset: 0,
        title: function () {
          return $(this).data('tooltip');
        }
      });
      this.addView(georeferenceTooltip);
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
    this.listenTo(this.model, 'change:collapsed', this.render);
    this.listenTo(this._queryGeometryModel, 'change:simple_geom', this.render);
    this.listenTo(this._queryRowsStatus, 'change:status', this.render);
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

    this._stackLayoutModel.nextStep(layerDefModel, 'layer-content', 'analyses', nodeId);
  },

  _onClickSource: function (event) {
    event.stopPropagation();

    this._stackLayoutModel.nextStep(this.model, 'layer-content');
  },

  _onEditLayer: function (event) {
    event && event.stopPropagation();

    if (this._queryRowsStatus.get('status') === 'fetching') return;

    if (this.model.canBeGeoreferenced()) {
      AnalysesService.setLayerId(this.model.id);
      AnalysesService.addGeoreferenceAnalysis();
      return;
    }

    this._stackLayoutModel.nextStep(this.model, 'layer-content', 'style');
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

    if (!this.model.canBeGeoreferenced()) {
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
      }, {
        label: _t('editor.layers.options.export'),
        val: 'export-data',
        action: this._exportLayer.bind(this)
      },
      {
        label: _t('editor.layers.options.center-map'),
        val: 'center-map',
        action: this._centerMap.bind(this)
      }]);
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
    var queryGeometryModel = nodeDefModel.queryGeometryModel;

    this._modals.create(function (modalModel) {
      return new ModalExportDataView({
        modalModel: modalModel,
        queryGeometryModel: queryGeometryModel,
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

  _queryGeometryHasGeom: function () {
    return !!this._queryGeometryModel.hasValue();
  },

  clean: function () {
    this._toggleClickEventsOnCapturePhase('remove');
    CoreView.prototype.clean.apply(this);
  }
});
