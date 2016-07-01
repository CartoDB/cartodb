var CoreView = require('backbone/core-view');
var _ = require('underscore');
var template = require('./editor-header.tpl');
var moment = require('moment');
var ContextMenuView = require('../components/context-menu/context-menu-view');
var CustomListCollection = require('../components/custom-list/custom-list-collection');
var ConfirmationView = require('../components/modals/confirmation/modal-confirmation-view');
var EditMetadataView = require('../components/modals/map-metadata/map-metadata-view');
var templateConfirmation = require('./delete-map-confirmation.tpl');
var removeMap = require('./map-operations/remove-map');
var renameMap = require('./map-operations/rename-map');
var InlineEditorView = require('../components/inline-editor/inline-editor-view');
var templateInlineEditor = require('./inline-editor.tpl');

module.exports = CoreView.extend({
  events: {
    'click .js-privacy': '_onClickPrivacy',
    'click .js-toggle-menu': '_onToggleContextMenuClicked'
  },

  initialize: function (opts) {
    if (!opts.editorModel) throw new Error('editorModel is required');
    if (!opts.modals) throw new Error('modals is required');
    if (!opts.visDefinitionModel) throw new Error('visDefinitionModel is required');
    if (!opts.privacyCollection) throw new Error('privacyCollection is required');
    if (!opts.onClickPrivacy) throw new Error('onClickPrivacy is required');

    this._editorModel = opts.editorModel;
    this._modals = opts.modals;
    this._visDefinitionModel = opts.visDefinitionModel;
    this._title = this._visDefinitionModel.get('name');
    this._privacyCollection = opts.privacyCollection;
    this._mapcapsCollection = opts.mapcapsCollection;

    _.bind(this._changeStyle, this);
    this._bindEvents();

    this._mapcapsCollection.fetch({reset: true});
  },

  render: function () {
    var model = this._privacyCollection.searchByPrivacy(this._visDefinitionModel.get('privacy'));
    var published = this._mapcapsCollection.length > 0
                    ? _t('editor.published', { when: moment(this._mapcapsCollection.first().get('created_at')).fromNow() })
                    : '';
    this.$el.html(
      template({
        title: this._title,
        privacy: model.get('privacy'),
        cssClass: model.get('cssClass'),
        published: published
      })
    );

    this._initViews();
    return this;
  },

  _initViews: function () {
    var self = this;
    this._inlineEditor = new InlineEditorView({
      template: templateInlineEditor,
      renderOptions: {
        name: self._visDefinitionModel.get('name')
      },
      onEdit: self._renameMap.bind(self)
    });

    this.$('.js-header').append(this._inlineEditor.render().el);
  },

  _bindEvents: function () {
    this.listenTo(this._visDefinitionModel, 'change:privacy', this.render);
    this.add_related_model(this._visDefinitionModel);

    this.listenTo(this._editorModel, 'change:edition', this._changeStyle);
    this.add_related_model(this._editorModel);

    this._mapcapsCollection.on('add reset', this.render, this);
    this.add_related_model(this._mapcapsCollection);
  },

  _renameMap: function () {
    var newName = this._inlineEditor.getValue();

    if (newName !== '' && newName !== this._visDefinitionModel.get('name')) {
      // Speed!
      this._onRenameSuccess(newName);

      renameMap({
        newName: newName,
        visDefinitionModel: this._visDefinitionModel,
        onError: this._onRenameError.bind(this)
      });
    }
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
      label: _t('editor.maps.options.rename'),
      val: 'rename-map'
    }, {
      label: _t('editor.maps.options.edit-metadata'),
      val: 'metadata-map'
    }, {
      label: _t('editor.maps.options.remove'),
      val: 'delete-map',
      destructive: true
    }]);

    var triggerElementID = 'context-menu-trigger-' + this.cid;
    this.$('.js-toggle-menu').attr('id', triggerElementID);
    this._menuView = new ContextMenuView({
      collection: menuItems,
      triggerElementID: triggerElementID,
      position: position
    });

    menuItems.bind('change:selected', function (menuItem) {
      if (menuItem.get('val') === 'delete-map') {
        this._confirmDeleteLayer();
      }
      if (menuItem.get('val') === 'metadata-map') {
        this._editMetadata();
      }
      if (menuItem.get('val') === 'rename-map') {
        this._inlineEditor.edit();
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
    var mapName = this._visDefinitionModel.get('name');

    this._modals.create(function (modalModel) {
      return new ConfirmationView({
        modalModel: modalModel,
        template: templateConfirmation,
        loadingTitle: _t('editor.maps.delete.loading', {name: mapName}),
        renderOpts: {
          name: mapName
        },
        runAction: function () {
          removeMap({
            onSuccess: self._onSuccessDestroyMap.bind(self, modalModel),
            onError: self._onErrorDestroyMap.bind(self, modalModel),
            visDefinitionModel: self._visDefinitionModel
          });
        }
      });
    });
  },

  _editMetadata: function () {
    var self = this;

    this._modals.create(function (modalModel) {
      return new EditMetadataView({
        modalModel: modalModel,
        visDefinitionModel: self._visDefinitionModel
      });
    });
  },

  _hideContextMenu: function () {
    this._menuView.remove();
    this.removeView(this._menuView);
    delete this._menuView;
  },

  _onSuccessDestroyMap: function (modal) {
    this.options.onRemoveMap && this.options.onRemoveMap();
  },

  _onErrorDestroyMap: function (modal) {
    modal.destroy();
  },

  _onRenameSuccess: function (newName) {
    this.$('.js-title').text(newName).show();
    this._inlineEditor.hide();
  },

  _onRenameError: function (oldName) {
    this.$('.js-title').text(oldName).show();
    this._inlineEditor.hide();
  },

  _changeStyle: function (m) {
    this._getTitle().toggleClass('is-dark', m.isEditing());
  },

  _getTitle: function () {
    return this.$('.Editor-HeaderInfo');
  },

  _onClickPrivacy: function () {
    this.options.onClickPrivacy && this.options.onClickPrivacy();
  }
});
