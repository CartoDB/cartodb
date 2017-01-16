var _ = require('underscore');
var $ = require('jquery');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var template = require('./data-layer.tpl');
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

var REQUIRED_OPTS = [
  'userActions',
  'stackLayoutModel',
  'layerDefinitionsCollection',
  'modals',
  'configModel',
  'stateDefinitionModel'
];

module.exports = CoreView.extend({

  tagName: 'li',

  className: 'Editor-ListLayer-item js-layer',

  events: {
    'click .js-toggle-menu': '_onToggleContextMenuClicked',
    'click .js-thumbnail': '_onEditLayer',
    'click .js-toggle': '_onToggleLayerClicked'
  },

  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (opts[item] === undefined) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);
    if (!_.isFunction(opts.newAnalysesView)) throw new Error('newAnalysesView is required as a function');

    this._newAnalysesView = opts.newAnalysesView;
    this._styleModel = this.model.styleModel;

    this.viewModel = new Backbone.Model();

    var nodeDefModel = this.model.getAnalysisDefinitionNodeModel();
    this._queryGeometryModel = nodeDefModel.queryGeometryModel;

    this._bindEvents();

    if (this._queryGeometryModel.canFetch() && !this._queryGeometryModel.hasValue()) {
      this._queryGeometryModel.fetch();
    }
  },

  render: function () {
    this.clearSubViews();

    var m = this.model;
    var self = this;
    var isTorque = m.isTorqueLayer();
    var isAnimation = this._styleModel.isAnimation();
    var geometryTemplate = this._getGeometryTemplate(this._queryGeometryModel.get('simple_geom'));

    this.$el.html(template({
      layerId: m.id,
      title: m.getName(),
      color: m.get('color'),
      isVisible: m.get('visible'),
      isAnimated: isAnimation,
      isTorque: isTorque,
      hasError: this._hasError(),
      isCollapsed: this._isCollapsed(),
      numberOfAnalyses: m.getNumberOfAnalyses()
    }));

    this._inlineEditor = new InlineEditorView({
      template: templateInlineEditor,
      renderOptions: {
        title: m.getName()
      },
      onClick: self._onEditLayer.bind(self),
      onEdit: self._renameLayer.bind(self)
    });
    this.addView(this._inlineEditor);

    this.$('.js-thumbnail').append(geometryTemplate({
      letter: m.get('letter')
    }));
    this.$('.js-header').append(this._inlineEditor.render().el);

    this.$el.toggleClass('is-unavailable', m.isNew());
    this.$el.toggleClass('js-sortable-item', !isTorque);
    this.$el.toggleClass('is-animated', isTorque);
    this.$('.js-thumbnail').toggleClass('is-hidden', this._isHidden());
    this.$('.js-title').toggleClass('is-hidden', this._isHidden());

    if (isTorque) {
      var tooltip = new TipsyTooltipView({
        el: this.$('.js-torqueIcon'),
        gravity: 's',
        offset: 0,
        title: function () {
          return $(this).data('tooltip');
        }
      });
      this.addView(tooltip);
    }

    this._toggleClickEventsOnCapturePhase('remove'); // remove any if rendered previously
    if (m.isNew()) {
      this._toggleClickEventsOnCapturePhase('add');
    }

    if (m.get('source')) {
      var analysesView = this._newAnalysesView(this.$('.js-analyses'), m);
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

    return this;
  },

  _bindEvents: function () {
    this.listenTo(this.model, 'change', this.render);
    this.listenToOnce(this.model, 'destroy', this._onDestroy);
    this.listenTo(this.viewModel, 'change:collapsed', this.render);
    this.listenTo(this._queryGeometryModel, 'change:simple_geom', this.render);
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
    return !!this.viewModel.get('collapsed');
  },

  _onEditLayer: function (e) {
    e.stopPropagation();
    this._stackLayoutModel.nextStep(this.model, 'layer-content');
  },

  _onToggleLayerClicked: function () {
    var savingOptions = {
      shouldDisableAutoStyle: false
    };
    this.model.toggleVisible();
    this._userActions.saveLayer(this.model, savingOptions);
  },

  _onToggleContextMenuClicked: function (event) {
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
    this._menuView.remove();
    this.removeView(this._menuView);
    delete this._menuView;
  },

  _showContextMenu: function (position) {
    var menuItems = new CustomListCollection([{
      label: this._isCollapsed() ? _t('editor.layers.options.expand') : _t('editor.layers.options.collapse'),
      val: 'collapse-expand-layer'
    }, {
      label: _t('editor.layers.options.rename'),
      val: 'rename-layer'
    }, {
      label: _t('editor.layers.options.export'),
      val: 'export-data'
    }]);
    if (this._queryGeometryHasGeom()) {
      menuItems.add({
        label: _t('editor.layers.options.center-map'),
        val: 'center-map'
      });
    }
    if (this.model.canBeDeletedByUser()) {
      menuItems.add({
        label: _t('editor.layers.options.delete'),
        val: 'delete-layer',
        destructive: true
      });
    }

    var triggerElementID = 'context-menu-trigger-' + this.model.cid;
    this.$('.js-toggle-menu').attr('id', triggerElementID);
    this._menuView = new ContextMenuView({
      collection: menuItems,
      triggerElementID: triggerElementID,
      position: position
    });

    menuItems.bind('change:selected', function (menuItem) {
      var selectedItem = menuItem.get('val');
      if (selectedItem === 'delete-layer') {
        this._confirmDeleteLayer();
      }
      if (selectedItem === 'collapse-expand-layer') {
        this.viewModel.set('collapsed', !this.viewModel.get('collapsed'));
      }
      if (selectedItem === 'rename-layer') {
        this._inlineEditor.edit();
      }
      if (selectedItem === 'export-data') {
        this._exportLayer();
      }
      if (selectedItem === 'center-map') {
        this._centerMap();
      }
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
    var self = this;
    var nodeDefModel = this.model.getAnalysisDefinitionNodeModel();
    var queryGeometryModel = nodeDefModel.queryGeometryModel;

    this._modals.create(function (modalModel) {
      return new ModalExportDataView({
        modalModel: modalModel,
        queryGeometryModel: queryGeometryModel,
        configModel: self._configModel,
        fileName: self.model.getName()
      });
    });
  },

  _confirmDeleteLayer: function () {
    var self = this;
    this._modals.create(function (modalModel) {
      var deleteLayerConfirmationView = new DeleteLayerConfirmationView({
        userActions: self._userActions,
        modals: self._modals,
        layerModel: self.model,
        modalModel: modalModel,
        visDefinitionModel: this.visDefinitionModel,
        widgetDefinitionsCollection: this.widgetDefinitionsCollection
      });

      return deleteLayerConfirmationView;
    });
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
    return !!this._queryGeometryModel.get('simple_geom');
  },

  clean: function () {
    this._toggleClickEventsOnCapturePhase('remove');
    CoreView.prototype.clean.apply(this);
  }
});
