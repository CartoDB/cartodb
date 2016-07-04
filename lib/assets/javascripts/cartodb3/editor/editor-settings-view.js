var _ = require('underscore');
var CoreView = require('backbone/core-view');
var createTextLabelsTabPane = require('../components/tab-pane/create-text-labels-tab-pane');
var TabPaneTemplate = require('./layers/layer-tab-pane.tpl');
var OptionsView = require('./settings/preview/preview-view');
var ScrollView = require('../components/scroll/scroll-view');
var Header = require('./editor-header.js');
var PrivacyView = require('../components/modals/privacy/privacy-view');

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
    var tabPaneTabs = [{
      label: _t('editor.settings.menu-tab-pane-labels.preview'),
      name: 'preview',
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
      }
    }, {
      label: _t('editor.settings.menu-tab-pane-labels.snapshots'),
      name: 'snapshots',
      selected: false,
      createContentView: function () {
        return new ScrollView({
          createContentView: function () {
            return new CoreView();
          }
        });
      }
    }];

    var tabPaneOptions = {
      tabPaneOptions: {
        template: TabPaneTemplate,
        tabPaneItemOptions: {
          tagName: 'li',
          className: 'CDB-NavMenu-item'
        }
      },
      tabPaneItemLabelOptions: {
        tagName: 'button',
        className: 'CDB-NavMenu-link u-upperCase'
      }
    };

    var header = new Header({
      editorModel: self._editorModel,
      mapcapsCollection: self._mapcapsCollection,
      modals: self._modals,
      visDefinitionModel: self._visDefinitionModel,
      privacyCollection: self._privacyCollection,
      onClickPrivacy: self._changePrivacy.bind(self),
      onRemoveMap: self._onRemoveMap.bind(self)
    });

    this.$el.append(header.render().$el);
    this.addView(header);

    this._layerTabPaneView = createTextLabelsTabPane(tabPaneTabs, tabPaneOptions);
    this.$el.append(this._layerTabPaneView.render().$el);
    this.addView(this._layerTabPaneView);

    return this;
  },

  _onRemoveMap: function () {
    window.location = this._userModel.get('base_url');
  },

  _changePrivacy: function () {
    var self = this;

    this._modals.create(function (modalModel) {
      return new PrivacyView({
        modalModel: modalModel,
        configModel: self._configModel,
        userModel: self._userModel,
        visDefinitionModel: self._visDefinitionModel,
        privacyCollection: self._privacyCollection
      });
    });
  }
});
