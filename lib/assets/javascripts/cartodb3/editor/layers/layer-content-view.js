var cdb = require('cartodb-deep-insights.js');
var createTextLabelsTabPane = require('../../components/tab-pane/create-text-labels-tab-pane');
var TabPaneTemplate = require('../tab-pane.tpl');
var Header = require('./layer-header-view.js');
var AnalysesView = require('./layer-content-views/analyses-view');
var PopupView = require('./layer-content-views/popup-view');

module.exports = cdb.core.View.extend({
  events: {
    'click .js-back': '_onClickBack'
  },

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('Layer definition is required');
    if (!opts.stackLayoutModel) throw new Error('StackLayoutModel is required');
    if (!opts.analysisDefinitionsCollection) throw new Error('analysisDefinitionsCollection is required');
    this.layerDefinitionModel = opts.layerDefinitionModel;
    this.analysisDefinitionsCollection = opts.analysisDefinitionsCollection;
    this.stackLayoutModel = opts.stackLayoutModel;
  },

  render: function () {
    var self = this;
    var tabPaneTabs = [{
      label: _t('editor.layers.menu-tab-pane-labels.data'),
      selected: !this.options.selectedNodeId,
      createContentView: function () {
        return new cdb.core.View();
      }
    }, {
      label: _t('editor.layers.menu-tab-pane-labels.analyses'),
      selected: this.options.selectedNodeId,
      createContentView: function () {
        return new AnalysesView({
          layerDefinitionModel: self.layerDefinitionModel,
          analysisDefinitionsCollection: self.analysisDefinitionsCollection,
          selectedNodeId: self.options.selectedNodeId
        });
      }
    }, {
      label: _t('editor.layers.menu-tab-pane-labels.style'),
      createContentView: function () {
        return new cdb.core.View();
      }
    }, {
      label: _t('editor.layers.menu-tab-pane-labels.popup'),
      createContentView: function () {
        return new PopupView({
          layerDefinitionModel: self.layerDefinitionModel
        });
      }
    }, {
      label: _t('editor.layers.menu-tab-pane-labels.legends'),
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
    this.$el.append(this._layerTabPaneView.render().$el);
    this.addView(this._layerTabPaneView);
    return this;
  },

  _onClickBack: function () {
    this.stackLayoutModel.prevStep('layers');
  }
});
