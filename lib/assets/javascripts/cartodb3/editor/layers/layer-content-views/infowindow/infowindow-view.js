var cdb = require('cartodb.js');
var InfowindowView = require('./infowindow-content-view');
var TooltipView = require('./infowindow-content-view');
var createTextLabelsTabPane = require('../../../../components/tab-pane/create-text-labels-tab-pane');
var TabPaneTemplate = require('../../../tab-pane-submenu.tpl');

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('Layer definition is required');
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._querySchemaModel = opts.querySchemaModel;
    this._layerInfowindowModel = this._layerDefinitionModel.infowindowModel;
    this._layerTooltipModel = this._layerDefinitionModel.tooltipModel;
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
        return new InfowindowView({
          querySchemaModel: self._querySchemaModel,
          layerInfowindowModel: self._layerInfowindowModel,
          layerDefinitionModel: self._layerDefinitionModel,
          templateStyles: [
            {
              value: 'none',
              label: _t('editor.layers.infowindow.style.none')
            }, {
              value: 'infowindow_light',
              label: _t('editor.layers.infowindow.style.light')
            }, {
              value: 'infowindow_dark',
              label: _t('editor.layers.infowindow.style.dark')
            }, {
              value: 'infowindow_light_header_blue',
              label: _t('editor.layers.infowindow.style.color')
            }, {
              value: 'infowindow_header_with_image',
              label: _t('editor.layers.infowindow.style.image')
            }
          ]
        });
      }
    }, {
      label: _t('editor.layers.infowindow-menu-tab-pane-labels.hover'),
      createContentView: function () {
        return new TooltipView({
          querySchemaModel: self._querySchemaModel,
          layerInfowindowModel: self._layerTooltipModel,
          layerDefinitionModel: self._layerDefinitionModel,
          templateStyles: [
            {
              value: 'none',
              label: _t('editor.layers.infowindow.style.none')
            }, {
              value: 'tooltip_dark',
              label: _t('editor.layers.infowindow.style.dark')
            }, {
              value: 'tooltip_light',
              label: _t('editor.layers.infowindow.style.light')
            }
          ]
        });
      }
    }];

    var tabPaneOptions = {
      tabPaneOptions: {
        template: TabPaneTemplate,
        tabPaneItemOptions: {
          tagName: 'li',
          className: 'CDB-NavSubmenu-item'
        }
      },
      tabPaneItemLabelOptions: {
        tagName: 'button',
        className: 'CDB-NavSubmenu-link u-upperCase'
      }
    };

    this._layerTabPaneView = createTextLabelsTabPane(tabPaneTabs, tabPaneOptions);
    this.$el.append(this._layerTabPaneView.render().$el);
    this.addView(this._layerTabPaneView);
  }
});
