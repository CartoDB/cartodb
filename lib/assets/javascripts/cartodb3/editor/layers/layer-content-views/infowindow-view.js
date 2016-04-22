var cdb = require('cartodb-deep-insights.js');
var InfowindowContentClickView = require('./infowindow/infowindow-click-view');
var InfowindowContentHoverView = require('./infowindow/infowindow-hover-view');
var createTextLabelsTabPane = require('../../../components/tab-pane/create-text-labels-tab-pane');
var TabPaneTemplate = require('../../tab-pane-submenu.tpl');

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('Layer definition is required');
    this.layerDefinitionModel = opts.layerDefinitionModel;

    this._layerTableModel = this.layerDefinitionModel.layerTableModel;

    if (!this._layerTableModel.get('fetched')) {
      this.listenToOnce(this._layerTableModel, 'change:fetched', this.render);
      this._layerTableModel.fetch();
    }

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
      label: _t('editor.layers.infowindow-menu-tab-pane-labels.click'),
      createContentView: function () {
        return new InfowindowContentClickView({
          layerDefinitionModel: self.layerDefinitionModel,
          layerTableModel: self._layerTableModel
        });
      }
    }, {
      label: _t('editor.layers.infowindow-menu-tab-pane-labels.hover'),
      createContentView: function () {
        return new InfowindowContentHoverView({
          layerDefinitionModel: self.layerDefinitionModel,
          layerTableModel: self._layerTableModel
        });
      }
    }];

    var tabPaneOptions = {
      tabPaneOptions: {
        template: TabPaneTemplate,
        tabPaneItemOptions: {
          tagName: 'li',
          className: 'CDB-NavSubmenu-Item'
        }
      },
      tabPaneItemLabelOptions: {
        tagName: 'button',
        className: 'CDB-NavSubmenu-Link u-upperCase'
      }
    };

    this._layerTabPaneView = createTextLabelsTabPane(tabPaneTabs, tabPaneOptions);
    this.$el.append(this._layerTabPaneView.render().$el);
    this.addView(this._layerTabPaneView);
  }
});
