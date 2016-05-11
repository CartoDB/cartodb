var cdb = require('cartodb.js');
var InfowindowView = require('./infowindow/infowindow-content-view');
var TooltipView = require('./infowindow/infowindow-content-view');
var createTextLabelsTabPane = require('../../../components/tab-pane/create-text-labels-tab-pane');
var TabPaneTemplate = require('../../tab-pane-submenu.tpl');

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('Layer definition is required');
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    this.layerDefinitionModel = opts.layerDefinitionModel;
    this._querySchemaModel = opts.querySchemaModel;
    this._layerInfowindowModel = this.layerDefinitionModel.infowindowModel;
    this._layerTooltipModel = this.layerDefinitionModel.tooltipModel;

    if (this._querySchemaModel.get('status') !== 'fetched') {
      // status can be: fetched, unavailable, fetching
      this.listenTo(this._querySchemaModel, 'change:status', this.render);
      this._querySchemaModel.fetch();
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
        return new InfowindowView({
          querySchemaModel: self._querySchemaModel,
          layerInfowindowModel: self._layerInfowindowModel,
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
