var cdb = require('cartodb-deep-insights.js');
var createTextLabelsTabPane = require('../../components/tab-pane/create-text-labels-tab-pane');
var TabPaneTemplate = require('../tab-pane.tpl');
var Header = require('./layer-header-view.js');

module.exports = cdb.core.View.extend({
  events: {
    'click .js-back': '_onClickBack'
  },

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('Layer definition is required');
    if (!opts.stackLayoutModel) throw new Error('StackLayoutModel is required');
    this.layerDefinitionModel = opts.layerDefinitionModel;
    this.stackLayoutModel = opts.stackLayoutModel;
  },

  render: function () {
    var tabPaneTabs = [{
      label: _t('editor.layers.data.title-label'),
      selected: true,
      createContentView: function () {
        return new cdb.core.View();
      }
    }, {
      label: _t('editor.layers.analyses.title-label'),
      createContentView: function () {
        return new cdb.core.View();
      }
    }, {
      label: _t('editor.layers.style.title-label'),
      createContentView: function () {
        return new cdb.core.View();
      }
    }, {
      label: _t('editor.layers.popup.title-label'),
      createContentView: function () {
        return new cdb.core.View();
      }
    }, {
      label: _t('editor.layers.legends.title-label'),
      createContentView: function () {
        return new cdb.core.View();
      }
    }];

    var header = new Header({
      layerDefinitionModel: this.layerDefinitionModel
    });
    this.addView(header);
    this.$el.append(header.render().$el);

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
    this.addView(this._layerTabPaneView);
    this.$el.append(this._layerTabPaneView.render().$el);

    return this;
  },

  _onClickBack: function () {
    this.stackLayoutModel.prevStep('layers');
  }
});
