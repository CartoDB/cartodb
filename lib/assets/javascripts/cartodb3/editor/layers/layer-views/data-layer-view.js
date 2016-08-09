var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var template = require('./data-layer.tpl');
var ContextMenuView = require('../../../components/context-menu/context-menu-view');
var CustomListCollection = require('../../../components/custom-list/custom-list-collection');
var renameLayer = require('../operations/rename-layer');
var removeLayer = require('../operations/remove-layer');
var ConfirmationView = require('../../../components/modals/confirmation/modal-confirmation-view');
var ModalExportDataView = require('../../../components/modals/export-data/modal-export-data-view');
var templateConfirmation = require('../delete-layer-confirmation.tpl');
var InlineEditorView = require('../../../components/inline-editor/inline-editor-view');
var templateInlineEditor = require('./inline-editor.tpl');
var geometryNoneTemplate = require('./geometry-none.tpl');
var geometryPointsTemplate = require('./geometry-points.tpl');
var geometryLinesTemplate = require('./geometry-lines.tpl');
var geometryPolygonsTemplate = require('./geometry-polygons.tpl');

module.exports = CoreView.extend({

  tagName: 'li',

  className: 'Editor-ListLayer-item js-layer',

  events: {
    'click .js-toggle-menu': '_onToggleContextMenuClicked',
    'click .js-thumbnail': '_onEditLayer',
    'click .js-toggle': '_onToggleLayerClicked'
  },

  initialize: function (opts) {
    if (!opts.userActions) throw new Error('userActions is required');
    if (!opts.stackLayoutModel) throw new Error('stackLayoutModel is required');
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.modals) throw new Error('modals is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!_.isFunction(opts.newAnalysesView)) throw new Error('newAnalysesView is required as a function');

    this._userActions = opts.userActions;
    this._stackLayoutModel = opts.stackLayoutModel;
    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._newAnalysesView = opts.newAnalysesView;
    this._configModel = opts.configModel;
    this._styleModel = this.model.styleModel;
    this._modals = opts.modals;

    this.viewModel = new Backbone.Model();

    this.listenTo(this.model, 'change', this.render);
    this.listenToOnce(this.model, 'destroy', this._onDestroy);
    this.listenTo(this.viewModel, 'change:collapsed', this.render);

    var nodeDefModel = this.model.getAnalysisDefinitionNodeModel();
    this._querySchemaModel = nodeDefModel.querySchemaModel;
    this.listenTo(this._querySchemaModel, 'change:raw_geom', this.render);

    if (this._querySchemaModel.canFetch() && !this._querySchemaModel.simpleGeometry()) {
      this._querySchemaModel.fetch();
    }
  },

  render: function () {
    this.clearSubViews();

    var m = this.model;
    var self = this;
    var isTorque = m.isTorqueLayer();
    var isAnimated = this._styleModel.isAnimated();
    var geometryTemplate = this._getGeometryTemplate(this._querySchemaModel.simpleGeometry());

    this.$el.html(template({
      layerId: m.id,
      title: m.getName(),
      color: m.get('color'),
      isVisible: m.get('visible'),
      isAnimated: isAnimated,
      isTorque: isTorque,
      isCollapsed: this._isCollapsed(),
      numberOfAnalyses: m.getNumberOfAnalyses() - 1 // Substracting one to skip "source" type analyses (datasets)
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
    this.$el.toggleClass('is-hidden', this._isHidden());
    this.$el.toggleClass('has-error', this._hasError());
    this.$el.toggleClass('js-sortable-item', !isTorque);
    this.$el.toggleClass('is-animated', isTorque);
    this.$('.Editor-ListLayer-media').toggleClass('is-hidden', this._isHidden());

    this._toggleClickEventsOnCapturePhase('remove'); // remove any if rendered previously
    if (m.isNew()) {
      this._toggleClickEventsOnCapturePhase('add');
    }

    if (m.get('source')) {
      var analysesView = this._newAnalysesView(this.$('.js-analyses'), m);
      this.addView(analysesView);
      analysesView.render();
    }

    return this;
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
    this.model.toggleVisible();
    this._userActions.saveLayer(this.model);
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
      if (menuItem.get('val') === 'delete-layer') {
        this._confirmDeleteLayer();
      }
      if (menuItem.get('val') === 'collapse-expand-layer') {
        this.viewModel.set('collapsed', !this.viewModel.get('collapsed'));
      }
      if (menuItem.get('val') === 'rename-layer') {
        this._inlineEditor.edit();
      }
      if (menuItem.get('val') === 'export-data') {
        this._exportLayer();
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
    var querySchemaModel = nodeDefModel.querySchemaModel;

    this._modals.create(function (modalModel) {
      return new ModalExportDataView({
        modalModel: modalModel,
        querySchemaModel: querySchemaModel,
        configModel: self._configModel,
        fileName: self.model.getName()
      });
    });
  },

  _confirmDeleteLayer: function () {
    var self = this;
    this._modals.create(function (modalModel) {
      return new ConfirmationView({
        modalModel: modalModel,
        template: templateConfirmation,
        renderOpts: {
          layerName: self.model.getTableName()
        },
        runAction: function () {
          removeLayer({
            userActions: self._userActions,
            layerDefinitionModel: self.model
          });
          modalModel.destroy();
        }
      });
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

  clean: function () {
    this._toggleClickEventsOnCapturePhase('remove');
    CoreView.prototype.clean.apply(this);
  }
});
