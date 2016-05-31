var _ = require('underscore');
var cdb = require('cartodb.js');
var createTextLabelsTabPane = require('../../components/tab-pane/create-text-labels-tab-pane');
var TabPaneTemplate = require('./layer-tab-pane.tpl');
var Header = require('./layer-header-view.js');
var LayerContentAnalysesView = require('./layer-content-views/layer-content-analyses-view');
var StyleView = require('../style/style-view');
var InfowindowsView = require('./layer-content-views/infowindows-view');
var TablesCollection = require('../../data/tables-collection');
var AnalysisSourceOptionsModel = require('./layer-content-views/analyses/analysis-source-options-model');
var AnalysisFormsCollection = require('./layer-content-views/analyses/analysis-forms-collection');

module.exports = cdb.core.View.extend({
  events: {
    'click .js-back': '_onClickBack'
  },

  options: {
    analysisPayload: null // id or a new analysis node attrs (may not be complete)
  },

  initialize: function (opts) {
    if (!opts.analysisDefinitionNodesCollection) throw new Error('analysisDefinitionNodesCollection is required');
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.stackLayoutModel) throw new Error('StackLayoutModel is required');
    if (!opts.modals) throw new Error('modals is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.editorModel) throw new Error('editorModel is required');
    if (!opts.analysis) throw new Error('analysis is required');

    this.analysisDefinitionNodesCollection = opts.analysisDefinitionNodesCollection;
    this.layerDefinitionModel = opts.layerDefinitionModel;
    this.layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this.stackLayoutModel = opts.stackLayoutModel;
    this.modals = opts.modals;
    this._configModel = opts.configModel;
    this._editorModel = opts.editorModel;
    this.analysis = opts.analysis;

    this._editorModel.on('change:edition', this._changeStyle, this);
    this.add_related_model(this._editorModel);
  },

  render: function () {
    this._unbindEvents();

    var self = this;
    var analysisPayload = this.options.analysisPayload;

    var tabPaneTabs = [{
      label: _t('editor.layers.menu-tab-pane-labels.data'),
      selected: !analysisPayload,
      createContentView: function () {
        return new cdb.core.View();
      }
    }, {
      label: _t('editor.layers.menu-tab-pane-labels.analyses'),
      selected: !!analysisPayload,
      createContentView: function () {
        var analysisSourceOptionsModel = new AnalysisSourceOptionsModel(null, {
          analysisDefinitionNodesCollection: self.analysisDefinitionNodesCollection,
          layerDefinitionsCollection: self.layerDefinitionsCollection,
          tablesCollection: new TablesCollection(null, {
            configModel: self._configModel
          })
        });
        analysisSourceOptionsModel.fetch();

        var analysisFormsCollection = new AnalysisFormsCollection(null, {
          layerDefinitionModel: self.layerDefinitionModel,
          analysisSourceOptionsModel: analysisSourceOptionsModel
        });
        analysisFormsCollection.resetByLayerDefinition();

        // e.g. when selected from layers view
        var selectedNodeId;
        if (_.isString(analysisPayload)) {
          selectedNodeId = analysisPayload;
        }

        // payload passed after continue when an option was selected in add-analysis-view
        if (_.isObject(analysisPayload)) {
          selectedNodeId = analysisPayload.id;
          analysisFormsCollection.addHead(analysisPayload);
        }

        return new LayerContentAnalysesView({
          className: 'Editor-content',
          analysis: self.analysis,
          analysisDefinitionNodesCollection: self.analysisDefinitionNodesCollection,
          analysisFormsCollection: analysisFormsCollection,
          layerDefinitionModel: self.layerDefinitionModel,
          selectedNodeId: selectedNodeId
        });
      }
    }, {
      label: _t('editor.layers.menu-tab-pane-labels.style'),
      createContentView: function () {
        var lastLayerNodeModel = self.layerDefinitionModel.getAnalysisDefinitionNodeModel();
        return new StyleView({
          className: 'Editor-content',
          analysisDefinitionsCollection: self.analysisDefinitionsCollection,
          querySchemaModel: lastLayerNodeModel.querySchemaModel,
          layerDefinitionsCollection: self.layerDefinitionsCollection,
          layerDefinitionModel: self.layerDefinitionModel,
          editorModel: self._editorModel,
          modals: self.modals
        });
      }
    }, {
      label: _t('editor.layers.menu-tab-pane-labels.infowindow'),
      createContentView: function () {
        return new InfowindowsView({
          className: 'Editor-content',
          layerDefinitionModel: self.layerDefinitionModel,
          querySchemaModel: self.layerDefinitionModel.getAnalysisDefinitionNodeModel().querySchemaModel,
          configModel: self._configModel,
          editorModel: self._editorModel
        });
      }
    }, {
      label: _t('editor.layers.menu-tab-pane-labels.legends'),
      createContentView: function () {
        return new cdb.core.View({
          className: 'Editor-content'
        });
      }
    }];

    var header = new Header({
      layerDefinitionModel: this.layerDefinitionModel,
      editorModel: this._editorModel
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
    this._bindEvents();
    this.$el.append(this._layerTabPaneView.render().$el);
    this.addView(this._layerTabPaneView);
    return this;
  },

  _unbindEvents: function () {
    if (this._layerTabPaneView && this._layerTabPaneView.collection) {
      this._layerTabPaneView.collection.off('change:selected', this._quitEditing, this);
    }
  },

  _bindEvents: function () {
    this._layerTabPaneView.collection.on('change:selected', this._quitEditing, this);
    this.add_related_model(this._layerTabPaneView.collection);
  },

  _onClickBack: function () {
    this._quitEditing();
    this.stackLayoutModel.prevStep('layers');
  },

  _changeStyle: function () {
    this.$el.toggleClass('is-dark', this._editorModel.isEditing());
    this._layerTabPaneView.changeStyleMenu(this._editorModel);
  },

  _quitEditing: function () {
    this._editorModel.set({edition: false});
  }
});
