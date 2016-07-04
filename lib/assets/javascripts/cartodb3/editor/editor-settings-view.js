var _ = require('underscore');
var CoreView = require('backbone/core-view');
var createTextLabelsTabPane = require('../components/tab-pane/create-text-labels-tab-pane');
var TabPaneTemplate = require('./layers/layer-tab-pane.tpl');
var OptionsView = require('./settings/preview/preview-view');
var ScrollView = require('../components/scroll/scroll-view');

var REQUIRED_OPTS = [
  'mapDefinitionModel',
  'overlaysCollection',
  'editorModel',
  'settingsCollection'
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

    this._layerTabPaneView = createTextLabelsTabPane(tabPaneTabs, tabPaneOptions);
    this.$el.append(this._layerTabPaneView.render().$el);
    this.addView(this._layerTabPaneView);

    return this;
  }
});
