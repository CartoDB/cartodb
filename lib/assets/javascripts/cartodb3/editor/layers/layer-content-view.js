var cdb = require('cartodb.js');
var createTextLabelsTabPane = require('../../components/tab-pane/create-text-labels-tab-pane');
var TabPaneTemplate = require('./layer-tab-pane.tpl');
var Header = require('./layer-header-view.js');
var AnalysesView = require('./layer-content-views/analyses-view');
var InfowindowView = require('./layer-content-views/infowindow-view');
var ScrollView = require('../../components/scroll/scroll');

module.exports = cdb.core.View.extend({
  events: {
    'click .js-back': '_onClickBack'
  },

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('Layer definition is required');
    if (!opts.stackLayoutModel) throw new Error('StackLayoutModel is required');
    if (!opts.modals) throw new Error('modals is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.analysis) throw new Error('analysis is required');

    this.layerDefinitionModel = opts.layerDefinitionModel;
    this.stackLayoutModel = opts.stackLayoutModel;
    this.modals = opts.modals;
    this._configModel = opts.configModel;
    this.analysis = opts.analysis;
  },

  render: function () {
    var self = this;
    var tabPaneTabs = [{
      label: _t('editor.layers.menu-tab-pane-labels.data'),
      selected: !this.options.selectedNode,
      createContentView: function () {
        return new cdb.core.View();
      }
    }, {
      label: _t('editor.layers.menu-tab-pane-labels.analyses'),
      selected: !!this.options.selectedNode,
      createContentView: function () {
        return new AnalysesView({
          layerDefinitionModel: self.layerDefinitionModel,
          modals: self.modals,
          analysis: self.analysis,
          selectedNode: self.options.selectedNode
        });
      }
    }, {
      label: _t('editor.layers.menu-tab-pane-labels.style'),
      createContentView: function () {
        return new cdb.core.View();
      }
    }, {
      label: _t('editor.layers.menu-tab-pane-labels.infowindow'),
      createContentView: function () {
        return new ScrollView({
          view: InfowindowView,
          height: 300,
          viewOptions: {
            layerDefinitionModel: self.layerDefinitionModel,
            querySchemaModel: self.analysisDefinitionsCollection.analysisDefinitionNodesCollection.get(self.layerDefinitionModel.get('source')).querySchemaModel,
            configModel: self._configModel
          }
        });

        // return new InfowindowView({
        //   layerDefinitionModel: self.layerDefinitionModel,
        //   querySchemaModel: self.analysisDefinitionsCollection.analysisDefinitionNodesCollection.get(self.layerDefinitionModel.get('source')).querySchemaModel,
        //   configModel: self._configModel
        // });
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
  },

  _onClickBack: function () {
    this.stackLayoutModel.prevStep('layers');
  }
});
