var CoreView = require('backbone/core-view');
var Backbone = require('backbone');
var template = require('./layer-header.tpl');
var SyncInfoView = require('./sync-info/sync-info-view');
var ContextMenuView = require('builder/components/context-menu/context-menu-view');
var CustomListCollection = require('builder/components/custom-list/custom-list-collection');
var VisTableModel = require('builder/data/visualization-table-model');
var renameLayer = require('./operations/rename-layer');
var DeleteLayerConfirmationView = require('builder/components/modals/remove-layer/delete-layer-confirmation-view');
var InlineEditorView = require('builder/components/inline-editor/inline-editor-view');
var ModalExportDataView = require('builder/components/modals/export-data/modal-export-data-view');
var templateInlineEditor = require('./inline-editor.tpl');
var zoomToData = require('builder/editor/map-operations/zoom-to-data');
var TipsyTooltipView = require('builder/components/tipsy-tooltip-view');
var IconView = require('builder/components/icon/icon-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'modals',
  'userActions',
  'layerDefinitionModel',
  'layerDefinitionsCollection',
  'configModel',
  'stateDefinitionModel',
  'editorModel',
  'userModel',
  'visDefinitionModel',
  'widgetDefinitionsCollection'
];

module.exports = CoreView.extend({
  module: 'layers:layer-header-view',

  className: 'js-editorPanelHeader',

  events: {
    'click .js-toggle-menu': '_onToggleContextMenuClicked',
    'click .js-zoom': '_onZoomClicked',
    'blur .js-input': '_hideRenameInput',
    'keyup .js-input': '_onKeyUpInput'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._sourceNodeModel = this._getSourceNode(this._getNodeModel());
    this._topQueryGeometryModel = null;

    this._initVisTableModel();
    this._initViewState();
    this._bindEvents();
    this._onSourceChanged();
  },

  render: function () {
    this.clearSubViews();

    var tableName = '';
    var url = '';

    if (this._visTableModel) {
      var tableModel = this._visTableModel.getTableModel();
      tableName = tableModel.getUnquotedName();
      url = this._visTableModel && this._visTableModel.datasetURL();
    }

    this.$el.html(
      template({
        letter: this._layerDefinitionModel.get('letter'),
        id: this._getNodeModel().id,
        bgColor: this._layerDefinitionModel.getColor(),
        isTableSource: !!this._sourceNodeModel,
        url: url,
        tableName: tableName,
        title: this._layerDefinitionModel.getTableName().replace(/_/gi, ' '),
        alias: this._layerDefinitionModel.getName(),
        isEmpty: this._viewState.get('isLayerEmpty'),
        canBeGeoreferenced: this._viewState.get('canBeGeoreferenced')
      })
    );

    this._showOrHideZoomVisibility();
    this._initViews();
    this._changeStyle();

    return this;
  },

  _initVisTableModel: function () {
    if (this._sourceNodeModel) {
      var tableName = this._sourceNodeModel.get('table_name');
      this._visTableModel = new VisTableModel({
        id: tableName,
        table: {
          name: tableName
        }
      }, {
        configModel: this._configModel
      });
    }
  },

  _initViewState: function () {
    this._viewState = new Backbone.Model({
      isLayerEmpty: false,
      hasGeom: true,
      canBeGeoreferenced: false
    });
    this._setViewStateValues();
  },

  _initViews: function () {
    this._addSyncInfo();

    this._inlineEditor = new InlineEditorView({
      template: templateInlineEditor,
      renderOptions: {
        alias: this._layerDefinitionModel.getName()
      },
      onEdit: this._renameLayer.bind(this)
    });
    this.addView(this._inlineEditor);
    this.$('.js-header').append(this._inlineEditor.render().el);

    var centerTooltip = new TipsyTooltipView({
      el: this._getZoom(),
      gravity: 'w',
      title: function () {
        return _t('editor.layers.options.center-map');
      }
    });

    this.addView(centerTooltip);

    var toggleMenuTooltip = new TipsyTooltipView({
      el: this._getToggleMenu(),
      gravity: 'w',
      title: function () {
        return _t('more-options');
      }
    });
    this.addView(toggleMenuTooltip);

    if (this._viewState.get('isLayerEmpty') || this._viewState.get('canBeGeoreferenced')) {
      var warningIcon = new IconView({
        placeholder: this.$el.find('.js-warningIcon'),
        icon: 'warning'
      });
      warningIcon.render();
      this.addView(warningIcon);

      var title = this._viewState.get('isLayerEmpty')
        ? _t('editor.layers.layer.empty-layer')
        : _t('editor.layers.layer.geocode-tooltip');

      var emptyLayerTooltip = new TipsyTooltipView({
        el: this.$el.find('.js-warningIcon'),
        gravity: 'w',
        title: function () {
          return title;
        }
      });
      this.addView(emptyLayerTooltip);
    }
  },

  _getNodeModel: function () {
    return this._layerDefinitionModel.getAnalysisDefinitionNodeModel();
  },

  _addSyncInfo: function () {
    var nodeModel = this._getNodeModel();

    if (nodeModel && nodeModel.tableModel && nodeModel.tableModel.isSync()) {
      this._createSyncInfo(nodeModel.tableModel);
    }
  },

  _createSyncInfo: function (tableModel) {
    var syncModel = tableModel.getSyncModel();
    this._syncInfoView = new SyncInfoView({
      modals: this._modals,
      syncModel: tableModel._syncModel,
      tableModel: tableModel,
      userModel: this._userModel
    });

    this.addView(this._syncInfoView);
    this.$el.prepend(this._syncInfoView.render().el);

    syncModel.bind('destroy', this._destroySyncInfo, this);
    this.add_related_model(syncModel);
  },

  _destroySyncInfo: function () {
    this.removeView(this._syncInfoView);
    this._syncInfoView.clean();
    delete this._syncInfoView;
  },

  _bindEvents: function () {
    if (this._tableNodeModel) {
      this._tableNodeModel.bind('change:synchronization', this.render, this);
      this.add_related_model(this._tableNodeModel);
    }

    this._changeStyle = this._changeStyle.bind(this);
    this._layerDefinitionModel.bind('change:source', this._onSourceChanged, this);
    this._layerDefinitionModel.bind('change:source', this.render, this);
    this._editorModel.on('change:edition', this._changeStyle, this);
    this.add_related_model(this._editorModel);
    this.add_related_model(this._layerDefinitionModel);
    this.listenTo(this._viewState, 'change:hasGeom', this._showOrHideZoomVisibility);
    this.listenTo(this._viewState, 'change:isLayerEmpty change:canBeGeoreferenced', this.render);
  },

  _getSourceNode: function (nodeModel) {
    var source;
    if (nodeModel.get('type') === 'source') {
      source = nodeModel;
    } else {
      var primarySource = nodeModel.getPrimarySource && nodeModel.getPrimarySource();
      if (primarySource && primarySource.get('type') === 'source') {
        source = primarySource;
      } else {
        source = this._getSourceNode(primarySource);
      }
    }

    return source;
  },

  _onSourceChanged: function () {
    var nodeModel = this._getNodeModel();

    if (this._topQueryGeometryModel !== null) {
      this._topQueryGeometryModel.unbind('change:simple_geom');
    }
    this._topQueryGeometryModel = nodeModel.queryGeometryModel.bind('change:simple_geom', this._setViewStateValues, this);
    this._setViewStateValues();
  },

  _changeStyle: function () {
    var editing = this._editorModel.isEditing();
    this._getTitle().toggleClass('u-whiteTextColor', editing);
    this._getText().toggleClass('u-altTextColor', editing);
    this._getInlineEditor().toggleClass('u-mainTextColor', editing);
    this._getLink().toggleClass('u-whiteTextColor', editing);
    this._getBack().toggleClass('u-whiteTextColor', editing);
    this._getToggleMenu().toggleClass('is-white', editing);
    this._getZoom().toggleClass('is-white', editing);
  },

  _getInlineEditor: function () {
    return this.$('.Inline-editor-input');
  },

  _getTitle: function () {
    return this.$('.Editor-HeaderInfo-titleText .js-title');
  },

  _getText: function () {
    return this.$('.Editor-breadcrumbItem');
  },

  _getLink: function () {
    return this.$('.CDB-Text a');
  },

  _getBack: function () {
    return this.$('.js-back');
  },

  _getToggleMenu: function () {
    return this.$('.js-toggle-menu');
  },

  _getZoom: function () {
    return this.$('.js-zoom');
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
    return this._menuView != null;
  },

  _showContextMenu: function (position) {
    var menuItems = new CustomListCollection([{
      label: _t('editor.layers.options.rename'),
      val: 'rename-layer'
    }, {
      label: this._layerHidden() ? _t('editor.layers.options.show') : _t('editor.layers.options.hide'),
      val: 'toggle-layer'
    }, {
      label: _t('editor.layers.options.export'),
      val: 'export-data'
    }]);
    if (this._layerDefinitionModel.canBeDeletedByUser()) {
      menuItems.add({
        label: _t('editor.layers.options.delete'),
        val: 'delete-layer',
        destructive: true
      });
    }

    var triggerElementID = 'context-menu-trigger-' + this._layerDefinitionModel.cid;
    this._getToggleMenu().attr('id', triggerElementID);
    this._menuView = new ContextMenuView({
      collection: menuItems,
      triggerElementID: triggerElementID,
      position: position
    });

    menuItems.bind('change:selected', function (menuItem) {
      if (menuItem.get('val') === 'delete-layer') {
        this._confirmDeleteLayer();
      }
      if (menuItem.get('val') === 'rename-layer') {
        this._inlineEditor.edit();
      }
      if (menuItem.get('val') === 'toggle-layer') {
        var savingOptions = {
          shouldPreserveAutoStyle: true
        };
        this._layerDefinitionModel.toggleVisible();
        this._userActions.saveLayer(this._layerDefinitionModel, savingOptions);
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

  _confirmDeleteLayer: function () {
    this._modals.create(function (modalModel) {
      var deleteLayerConfirmationView = new DeleteLayerConfirmationView({
        userActions: this._userActions,
        modals: this._modals,
        layerModel: this._layerDefinitionModel,
        modalModel: modalModel,
        visDefinitionModel: this._visDefinitionModel,
        widgetDefinitionsCollection: this._widgetDefinitionsCollection
      });

      return deleteLayerConfirmationView;
    }.bind(this));
  },

  _hideContextMenu: function () {
    this.removeView(this._menuView);
    this._menuView.clean();
    delete this._menuView;
  },

  _exportLayer: function () {
    var nodeModel = this._getNodeModel();
    var queryGeometryModel = nodeModel.queryGeometryModel;

    this._modals.create(function (modalModel) {
      return new ModalExportDataView({
        fromView: 'layer',
        modalModel: modalModel,
        queryGeometryModel: queryGeometryModel,
        layerModel: this._layerDefinitionModel,
        configModel: this._configModel,
        filename: this._layerDefinitionModel.getName()
      });
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
        layerDefinitionModel: this._layerDefinitionModel,
        onError: this._onSaveError.bind(this)
      });
    }
  },

  _onSaveSuccess: function (newName) {
    this.$('.js-title').text(newName).show();
    this.$('.js-title-editor').attr('title', newName);
    this._inlineEditor.hide();
  },

  _onSaveError: function (oldName) {
    this.$('.js-title').text(oldName).show();
    this._inlineEditor.hide();
  },

  _layerHidden: function () {
    return this._layerDefinitionModel.get('visible') === false;
  },

  _onZoomClicked: function () {
    var nodeModel = this._getNodeModel();
    var query = nodeModel.querySchemaModel.get('query');
    zoomToData(this._configModel, this._stateDefinitionModel, query);
  },

  _showOrHideZoomVisibility: function () {
    this._getZoom().toggle(this._viewState.get('hasGeom'));
  },

  _setViewStateValues: function () {
    var nodeModel = this._getNodeModel();
    var isEmptyPromise = this._layerDefinitionModel.isEmptyAsync();
    var hasGeomPromise = nodeModel.queryGeometryModel.hasValueAsync();
    var canBeGeoreferencedPromise = this._layerDefinitionModel.canBeGeoreferenced();

    Promise.all([isEmptyPromise, hasGeomPromise, canBeGeoreferencedPromise])
      .then(function (values) {
        this._viewState.set({
          isLayerEmpty: values[0],
          hasGeom: values[1],
          canBeGeoreferenced: values[2]
        });
      }.bind(this));
  }
});
