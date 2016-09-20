var CoreView = require('backbone/core-view');
var _ = require('underscore');
var template = require('./editor-header.tpl');
var moment = require('moment');
var ConfirmationView = require('../components/modals/confirmation/modal-confirmation-view');
var EditMetadataView = require('../components/modals/map-metadata/map-metadata-view');
var templateConfirmation = require('./delete-map-confirmation.tpl');
var ExportView = require('./components/modals/export-map/modal-export-map-view');
var ExportMapModel = require('../data/export-map-definition-model.js');
var removeMap = require('./map-operations/remove-map');
var renameMap = require('./map-operations/rename-map');
var InlineEditorView = require('../components/inline-editor/inline-editor-view');
var templateInlineEditor = require('./inline-editor.tpl');
var CreationModalView = require('../components/modals/creation/modal-creation-view');
var VisDefinitionModel = require('../data/vis-definition-model');
var errorParser = require('../helpers/error-parser');
var ShareWith = require('../components/modals/publish/share-with-view');
var ContextMenuFactory = require('../components/context-menu-factory-view');

module.exports = CoreView.extend({
  events: {
    'click .js-privacy': '_onClickPrivacy'
  },

  initialize: function (opts) {
    if (!opts.editorModel) throw new Error('editorModel is required');
    if (!opts.modals) throw new Error('modals is required');
    if (!opts.visDefinitionModel) throw new Error('visDefinitionModel is required');
    if (!opts.privacyCollection) throw new Error('privacyCollection is required');
    if (!opts.onClickPrivacy) throw new Error('onClickPrivacy is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.userModel) throw new Error('userModel is required');

    this._userModel = opts.userModel;
    this._editorModel = opts.editorModel;
    this._configModel = opts.configModel;
    this._modals = opts.modals;
    this._visDefinitionModel = opts.visDefinitionModel;
    this._title = this._visDefinitionModel.get('name');
    this._privacyCollection = opts.privacyCollection;
    this._mapcapsCollection = opts.mapcapsCollection;

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
        isSimple: !this._userModel.isInsideOrg(),
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
    this.addView(this._inlineEditor);

    var shareWith = new ShareWith({
      visDefinitionModel: this._visDefinitionModel,
      userModel: this._userModel,
      action: this._onClickPrivacy.bind(this),
      separationClass: 'u-rSpace--m'
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
    this.options.onClickPrivacy && this.options.onClickPrivacy();
  }
});
