var CoreView = require('backbone/core-view');
var _ = require('underscore');
var template = require('./editor-header.tpl');
var moment = require('moment');
var ConfirmationView = require('builder/components/modals/confirmation/modal-confirmation-view');
var EditMetadataView = require('builder/components/modals/map-metadata/map-metadata-view');
var templateConfirmation = require('./delete-map-confirmation.tpl');
var ExportView = require('builder/editor/components/modals/export-map/modal-export-map-view');
var ExportMapModel = require('builder/data/export-map-definition-model.js');
var removeMap = require('./map-operations/remove-map');
var renameMap = require('./map-operations/rename-map');
var InlineEditorView = require('builder/components/inline-editor/inline-editor-view');
var templateInlineEditor = require('./inline-editor.tpl');
var CreationModalView = require('builder/components/modals/creation/modal-creation-view');
var VisDefinitionModel = require('builder/data/vis-definition-model');
var errorParser = require('builder/helpers/error-parser');
var ShareWith = require('builder/components/modals/publish/share-with-view');
var ContextMenuFactory = require('builder/components/context-menu-factory-view');
var PrivacyDropdown = require('builder/components/privacy-dropdown/privacy-dropdown-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'userModel',
  'editorModel',
  'configModel',
  'modals',
  'visDefinitionModel',
  'privacyCollection',
  'mapcapsCollection',
  'clickPrivacyAction'
];

module.exports = CoreView.extend({

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._title = this._visDefinitionModel.get('name');

    _.bind(this._changeStyle, this);

    this._bindEvents();
  },

  render: function () {
    var model = this._privacyCollection.searchByPrivacy(this._visDefinitionModel.get('privacy'));
    var published = this._mapcapsCollection.length > 0
      ? _t('editor.published', { when: moment(this._mapcapsCollection.first().get('created_at')).fromNow() })
      : _t('editor.unpublished');

    this.$el.html(
      template({
        title: this._title,
        privacy: model.get('privacy'),
        cssClass: model.get('cssClass'),
        avatar: this._userModel.get('avatar_url'),
        isInsideOrg: this._userModel.isInsideOrg(),
        published: published
      })
    );

    this._initViews();
    this._changeStyle(this._editorModel);

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
    this.addView(this._inlineEditor);

    var shareWith = new ShareWith({
      visDefinitionModel: this._visDefinitionModel,
      userModel: this._userModel,
      separationClass: 'u-rSpace--m',
      clickPrivacyAction: this._onClickPrivacy.bind(this)
    });

    this.$('.js-share-users').append(shareWith.render().el);
    this.addView(shareWith);

    var menuItems = [{
      label: _t('editor.maps.options.rename'),
      val: 'rename-map',
      action: this._onRenameMap.bind(this)
    }, {
      label: _t('editor.maps.options.duplicate'),
      val: 'duplicate-map',
      action: this._duplicateMap.bind(this)
    }, {
      label: _t('editor.maps.options.edit-metadata'),
      val: 'metadata-map',
      action: this._editMetadata.bind(this)
    }, {
      label: _t('editor.maps.options.export-map'),
      val: 'export-map',
      action: this._exportMap.bind(this)
    }, {
      label: _t('editor.maps.options.export-image'),
      val: 'export-image',
      action: this._exportImage.bind(this)
    }, {
      label: _t('editor.maps.options.remove'),
      val: 'delete-map',
      destructive: true,
      action: this._confirmDeleteLayer.bind(this)
    }];

    this._contextMenuFactory = new ContextMenuFactory({
      menuItems: menuItems
    });

    this.$('.js-context-menu').append(this._contextMenuFactory.render().el);
    this.addView(this._contextMenuFactory);

    var privacyDropdown = new PrivacyDropdown({
      privacyCollection: this._privacyCollection,
      visDefinitionModel: this._visDefinitionModel,
      userModel: this._userModel,
      configModel: this._configModel,
      mapcapsCollection: this._mapcapsCollection,
      isOwner: true
    });

    this.$('.js-dropdown').append(privacyDropdown.render().el);
    this.addView(privacyDropdown);
  },

  _bindEvents: function () {
    this.listenTo(this._visDefinitionModel, 'change:privacy change:name', this.render);
    this.add_related_model(this._visDefinitionModel);

    this.listenTo(this._editorModel, 'change:edition', this._changeStyle);
    this.add_related_model(this._editorModel);

    this._mapcapsCollection.on('add reset', this.render, this);
    this._mapcapsCollection.on('change:status', this.render, this);
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

  _onRenameMap: function () {
    this._inlineEditor.edit();
  },

  _duplicateMap: function () {
    var self = this;
    var mapName = this._visDefinitionModel.get('name');

    this._modals.create(function (modalModel) {
      return new CreationModalView({
        modalModel: modalModel,
        loadingTitle: _t('editor.maps.duplicate.loading', { name: mapName }),
        errorTitle: _t('editor.maps.duplicate.error', { name: mapName }),
        runAction: function (opts) {
          var newVisModel = new VisDefinitionModel({
            name: mapName
          }, {
            configModel: self._configModel
          });

          newVisModel.save({
            source_visualization_id: self._visDefinitionModel.get('id')
          }, {
            success: function (visModel) {
              window.location = visModel.builderURL();
            },
            error: function (mdl, e) {
              opts.error && opts.error(errorParser(e));
            }
          });
        }
      });
    });
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

  _exportMap: function () {
    var mapName = this._visDefinitionModel.get('name');
    var visID = this._visDefinitionModel.get('id');

    var exportMapModel = new ExportMapModel({
      visualization_id: visID
    }, {
      configModel: this._configModel
    });

    this._modals.create(function (modalModel) {
      return new ExportView({
        modalModel: modalModel,
        exportMapModel: exportMapModel,
        renderOpts: {
          name: mapName
        }
      });
    });
  },

  _exportImage: function () {
    this.trigger('export-image', this);
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
    this.options.clickPrivacyAction && this.options.clickPrivacyAction();
  }
});
