var CoreView = require('backbone/core-view');
var $ = require('jquery');
var _ = require('underscore');
var template = require('./layer-header.tpl');
var ContextMenuView = require('../../components/context-menu/context-menu-view');
var CustomListCollection = require('../../components/custom-list/custom-list-collection');
var renameLayer = require('./layer-views/layer-rename');
var ConfirmationView = require('../../components/modals/confirmation/modal-confirmation-view');
var templateConfirmation = require('./delete-layer-confirmation.tpl');

module.exports = CoreView.extend({
  events: {
    'click .js-toggle-menu': '_onToggleContextMenuClicked',
    'blur .js-input': '_hideRenameInput',
    'keyup .js-input': '_onKeyUpInput'
  },

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.modals) throw new Error('modals is required');

    this._modals = opts.modals;
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;

    this._editorModel = opts.editorModel;
    _.bind(this._changeStyle, this);
    this._bindEvents();
  },

  render: function () {
    this.$el.html(
      template({
        title: this._layerDefinitionModel.getTableName().replace(/_/gi, ' '),
        alias: this._layerDefinitionModel.getName()
      })
    );
    return this;
  },

  _bindEvents: function () {
    this.listenTo(this._editorModel, 'change:edition', this._changeStyle);
    this.add_related_model(this._editorModel);
  },

  _changeStyle: function (m) {
    var editing = m.isEditing();
    this._getTitle().toggleClass('u-whiteTextColor', editing);
    this._getIcon().toggleClass('is-white', editing);
    this._getLink().toggleClass('u-altTextColor', editing);
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
    }]);
    if (this._layerCanBeDeleted()) {
      menuItems.add({
        label: 'Delete layer…',
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
        this._showRenameInput();
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
      return new ConfirmationView({
        modalModel: modalModel,
        template: templateConfirmation,
        renderOpts: {
          layerName: self._layerDefinitionModel.getTableName()
        },
        runAction: function () {
          self._layerDefinitionModel.destroy();
          modalModel.destroy();
        }
      });
    });
  },

  _hideContextMenu: function () {
    this._menuView.remove();
    this.removeView(this._menuView);
    delete this._menuView;
  },

  _layerCanBeDeleted: function () {
    return this._layerDefinitionsCollection.getNumberOfDataLayers() > 1;
  },

  _showRenameInput: function () {
    this.$('.js-input').show().focus();
    this.$('.js-input').get(0).setSelectionRange(0, this.$('.js-input').val().length);
  },

  _hideRenameInput: function () {
    this.$('.js-input').hide();
  },

  _onKeyUpInput: function (e) {
    if (e.which === $.ui.keyCode.ESCAPE) {
      this._hideRenameInput();
    }

    if (e.which === $.ui.keyCode.ENTER) {
      this._renameLayer();
    }
  },

  _renameLayer: function () {
    var newName = this.$('.js-input').val();

    if (newName !== '') {
      // Optimistic
      this._onSaveSuccess(newName);

      renameLayer({
        newName: newName,
        layerDefinitionsCollection: this._layerDefinitionsCollection,
        layerDefinitionModel: this._layerDefinitionModel,
        onError: this._onSaveError.bind(this)
      });
    }
  },

  _onSaveSuccess: function (newName) {
    this.$('.js-title').text(newName).show();
    this.$('.js-input').hide();
  },

  _onSaveError: function (oldName) {
    this.$('.js-title').text(oldName).show();
    this.$('.js-input').hide();
  }
});
