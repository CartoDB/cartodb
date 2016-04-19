var cdb = require('cartodb-deep-insights.js');
var PopupContentClickView = require('./popup-content-click-view');
var createTextLabelsTabPane = require('../../../components/tab-pane/create-text-labels-tab-pane');
var TabPaneTemplate = require('../../tab-pane.tpl');

module.exports = cdb.core.View.extend({

  events: {
  },

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('Layer definition is required');
    this.layerDefinitionModel = opts.layerDefinitionModel;
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    this._initViews();

    return this;
  },

  _initViews: function () {
    var self = this;
    var tabPaneTabs = [{
      label: _t('editor.layers.popup-menu-tab-pane-labels.click'),
      createContentView: function () {
        return new PopupContentClickView({
          layerDefinitionModel: self.layerDefinitionModel
        });
      }
    }, {
      label: _t('editor.layers.popup-menu-tab-pane-labels.hover'),
      createContentView: function () {
        return new cdb.core.View();
      }
    }];

    var tabPaneOptions = {
      tabPaneOptions: {
        tagName: 'nav',
        className: 'CDB-NavMenu',
        template: TabPaneTemplate,
        tabPaneItemOptions: {
          tagName: 'li',
          className: 'CDB-NavMenu-Item'
        }
      },
      tabPaneItemLabelOptions: {
        tagName: 'button',
        className: 'CDB-NavMenu-Link u-upperCase'
      }
    };

    this._layerTabPaneView = createTextLabelsTabPane(tabPaneTabs, tabPaneOptions);
    this.$el.append(this._layerTabPaneView.render().$el);
    this.addView(this._layerTabPaneView);
  }
});
