var CoreView = require('backbone/core-view');
var OptionsView = require('./settings/preview/preview-view');
var ScrollView = require('builder/components/scroll/scroll-view');
var Header = require('./editor-header.js');
var PublishView = require('builder/components/modals/publish/publish-view');
var ShareButtonView = require('./layers/share-button-view');
var PanelWithOptionsView = require('builder/components/view-options/panel-with-options-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'configModel',
  'editorModel',
  'mapDefinitionModel',
  'mapcapsCollection',
  'modals',
  'overlaysCollection',
  'privacyCollection',
  'settingsCollection',
  'userModel',
  'visDefinitionModel'
];

module.exports = CoreView.extend({

  module: 'editor:editor-settings-pane',

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._editorModel.set('edition', false);
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    var header = new Header({
      userModel: this._userModel,
      editorModel: this._editorModel,
      configModel: this._configModel,
      mapcapsCollection: this._mapcapsCollection,
      modals: this._modals,
      visDefinitionModel: this._visDefinitionModel,
      privacyCollection: this._privacyCollection,
      clickPrivacyAction: this._share.bind(this),
      onRemoveMap: this._onRemoveMap.bind(this)
    });

    header.bind('export-image', function () {
      this.trigger('export-image', this);
    }, this);

    this.$el.append(header.render().$el);
    this.addView(header);

    var view = new PanelWithOptionsView({
      className: 'Editor-content',
      editorModel: this._editorModel,
      infoboxModel: this._infoboxModel,
      infoboxCollection: this._infoboxCollection,
      createContentView: function () {
        return new ScrollView({
          createContentView: function () {
            return new OptionsView({
              mapDefinitionModel: this._mapDefinitionModel,
              settingsCollection: this._settingsCollection,
              overlaysCollection: this._overlaysCollection
            });
          }.bind(this)
        });
      }.bind(this),
      createActionView: function () {
        return new ShareButtonView({
          visDefinitionModel: this._visDefinitionModel,
          onClickAction: this._share.bind(this)
        });
      }.bind(this)
    });

    this.$el.append(view.render().$el);
    this.addView(view);

    return this;
  },

  _share: function () {
    var publishView = this._modals.create(function (modalModel) {
      return new PublishView({
        mapcapsCollection: this._mapcapsCollection,
        modalModel: modalModel,
        visDefinitionModel: this._visDefinitionModel,
        privacyCollection: this._privacyCollection,
        userModel: this._userModel,
        configModel: this._configModel,
        isOwner: this._isOwner()
      });
    }.bind(this), {
      breadcrumbsEnabled: true
    });

    this.addView(publishView);
  },

  _onRemoveMap: function () {
    window.location = this._userModel.get('base_url');
  },

  _isOwner: function () {
    return this._visDefinitionModel
      .getPermissionModel()
      .isOwner(this._userModel);
  }
});
