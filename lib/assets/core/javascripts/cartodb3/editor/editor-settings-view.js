var _ = require('underscore');
var CoreView = require('backbone/core-view');
var OptionsView = require('./settings/preview/preview-view');
var ScrollView = require('../components/scroll/scroll-view');
var Header = require('./editor-header.js');
var PublishView = require('../components/modals/publish/publish-view');
var ShareButtonView = require('./layers/share-button-view');
var PanelWithOptionsView = require('../components/view-options/panel-with-options-view');

var REQUIRED_OPTS = [
  'modals',
  'visDefinitionModel',
  'privacyCollection',
  'mapDefinitionModel',
  'mapcapsCollection',
  'overlaysCollection',
  'editorModel',
  'settingsCollection',
  'configModel',
  'userModel'
];

module.exports = CoreView.extend({
  className: 'Editor-panel',
  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (!opts[item]) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);

    this._editorModel.set('edition', false);
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    var self = this;

    var header = new Header({
      userModel: this._userModel,
      editorModel: this._editorModel,
      configModel: this._configModel,
      mapcapsCollection: this._mapcapsCollection,
      modals: this._modals,
      visDefinitionModel: this._visDefinitionModel,
      privacyCollection: this._privacyCollection,
      onClickPrivacy: this._share.bind(self),
      onRemoveMap: this._onRemoveMap.bind(self)
    });

    this.$el.append(header.render().$el);
    this.addView(header);

    var view = new PanelWithOptionsView({
      className: 'Editor-content',
      editorModel: self._editorModel,
      createContentView: function () {
        return new ScrollView({
          createContentView: function () {
            return new OptionsView({
              mapDefinitionModel: self._mapDefinitionModel,
              settingsCollection: self._settingsCollection,
              overlaysCollection: self._overlaysCollection
            });
          }
        });
      },
      createActionView: function () {
        return new ShareButtonView({
          visDefinitionModel: self._visDefinitionModel,
          onClickAction: self._share.bind(self)
        });
      }
    });

    this.$el.append(view.render().$el);
    this.addView(view);

    return this;
  },

  _share: function () {
    var self = this;

    this._modals.create(function (modalModel) {
      return new PublishView({
        mapcapsCollection: self._mapcapsCollection,
        modalModel: modalModel,
        visDefinitionModel: self._visDefinitionModel,
        privacyCollection: self._privacyCollection,
        userModel: self._userModel,
        configModel: self._configModel
      });
    });
  },

  _onRemoveMap: function () {
    window.location = this._userModel.get('base_url');
  }
});
