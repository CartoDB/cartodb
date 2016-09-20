var CoreView = require('backbone/core-view');
var template = require('./layer-header.tpl');
var SyncInfoView = require('./sync-info/sync-info-view');
var ContextMenuView = require('../../components/context-menu/context-menu-view');
var CustomListCollection = require('../../components/custom-list/custom-list-collection');
var VisTableModel = require('../../data/visualization-table-model');
var renameLayer = require('./operations/rename-layer');
var DeleteLayerConfirmationView = require('../../components/modals/remove-layer/delete-layer-confirmation-view');
var InlineEditorView = require('../../components/inline-editor/inline-editor-view');
var ModalExportDataView = require('../../components/modals/export-data/modal-export-data-view');
var templateInlineEditor = require('./inline-editor.tpl');
var layerColors = require('../../data/layer-colors');

module.exports = CoreView.extend({
  events: {
    'click .js-toggle-menu': '_onToggleContextMenuClicked',
    'blur .js-input': '_hideRenameInput',
    'keyup .js-input': '_onKeyUpInput'
  },

  initialize: function (opts) {
    if (!opts.userActions) throw new Error('userActions is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.modals) throw new Error('modals is required');

    this._userActions = opts.userActions;
    this._modals = opts.modals;
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._configModel = opts.configModel;
    this._tableNodeModel = opts.tableNodeModel;

    this._sourceNode = this._getSourceNode();

    if (this._sourceNode) {
      var tableName = this._sourceNode.get('table_name');
      this._visTableModel = new VisTableModel({
        id: tableName,
        table: {
          name: tableName
        }
      }, {
        configModel: this._configModel
      });
    }

    this._editorModel = opts.editorModel;
    this._changeStyle = this._changeStyle.bind(this);
    this._bindEvents();
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

    var letter = this._layerDefinitionModel.get('letter');

    this.$el.html(
      template({
        letter: letter,
        bgColor: layerColors.getColorForLetter(letter),
        isTableSource: !!this._sourceNode,
        url: url,
        tableName: tableName,
        title: this._layerDefinitionModel.getTableName().replace(/_/gi, ' '),
        alias: this._layerDefinitionModel.getName()
      })
    );

    this._initViews();
    return this;
  },

  _initViews: function () {
    var isSync = this._tableNodeModel && this._tableNodeModel._syncModel && this._tableNodeModel._syncModel.isSync();
    if (isSync) {
      var syncInfo = new SyncInfoView({
        modals: this._modals,
        syncModel: this._tableNodeModel._syncModel,
        tableModel: this._tableNodeModel
      });
      this.addView(syncInfo);
      this.$el.prepend(syncInfo.render().el);
    }

    this._inlineEditor = new InlineEditorView({
      template: templateInlineEditor,
      renderOptions: {
        alias: this._layerDefinitionModel.getName()
      },
      onEdit: this._renameLayer.bind(this)
    });
    this.addView(this._inlineEditor);

    this.$('.js-header').append(this._inlineEditor.render().el);
  },

  _bindEvents: function () {
    if (this._tableNodeModel) {
      this._tableNodeModel.bind('change:synchronization', this.render, this);
      this.add_related_model(this._tableNodeModel);
    }
    this._layerDefinitionModel.bind('change:source', this.render, this);
    this._editorModel.on('change:edition', this._changeStyle, this);
    this.add_related_model(this._editorModel);
    this.add_related_model(this._layerDefinitionModel);
  },

  _getSourceNode: function () {
    var node = this._layerDefinitionModel.getAnalysisDefinitionNodeModel();
    var source;
    if (node.get('type') === 'source') {
      source = node;
    } else {
      var primarySource = node.getPrimarySource();
      if (primarySource && primarySource.get('type') === 'source') {
        source = primarySource;
      }
    }

    return source;
  },

  _changeStyle: function () {
    var editing = this._editorModel.isEditing();
    this._getTitle().toggleClass('u-whiteTextColor', editing);
    this._getIcon().toggleClass('is-white', editing);
    this._getInlineEditor().toggleClass('u-mainTextColor', editing);
    this._getLink().toggleClass('u-altTextColor', editing);
    this._getBack().toggleClass('u-whiteTextColor', editing);
    this._getToggleMenu().toggleClass('is-white', editing);
  },

  _getInlineEditor: function () {
    return this.$('.Inline-editor-input');
  },

  _getTitle: function () {
    return this.$('.Editor-HeaderInfo-titleText');
  },

  _getIcon: function () {
    return this.$('.CDB-Shape-Dataset');
  },

  _getLink: function () {
    return this.$('.CDB-Text a');
  },

  _getBack: function () {
    return this.$('.js-back');
  },

  _getToggleMenu: function () {
    return this.$('.CDB-Shape-threePoints');
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
      if (menuItem.get('val') === 'rename-layer') {
        this._inlineEditor.edit();
      }
      if (menuItem.get('val') === 'toggle-layer') {
        this._layerDefinitionModel.toggleVisible();
        this._userActions.saveLayer(this._layerDefinitionModel);
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
    var self = this;
    this._modals.create(function (modalModel) {
      var deleteLayerConfirmationView = new DeleteLayerConfirmationView({
        userActions: self._userActions,
        modals: self._modals,
        layerModel: self._layerDefinitionModel,
        modalModel: modalModel,
        visDefinitionModel: this.visDefinitionModel,
        widgetDefinitionsCollection: this.widgetDefinitionsCollection
      });

      return deleteLayerConfirmationView;
    });
  },

  _hideContextMenu: function () {
    this._menuView.remove();
    this.removeView(this._menuView);
    delete this._menuView;
  },

  _exportLayer: function () {
    var self = this;
    var nodeDefModel = this._layerDefinitionModel.getAnalysisDefinitionNodeModel();
    var queryGeometryModel = nodeDefModel.queryGeometryModel;

    this._modals.create(function (modalModel) {
      return new ModalExportDataView({
        modalModel: modalModel,
        queryGeometryModel: queryGeometryModel,
        configModel: self._configModel,
        fileName: self._layerDefinitionModel.getName()
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
        layerDefinitionModel: this._layerDefinitionModel,
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

  _layerHidden: function () {
    return this._layerDefinitionModel.get('visible') === false;
  }
});
