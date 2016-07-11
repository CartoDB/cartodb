var _ = require('underscore');
var $ = require('jquery');
var CoreView = require('backbone/core-view');
var createTextLabelsTabPane = require('../../components/tab-pane/create-text-labels-tab-pane');
var TabPaneTemplate = require('./layer-tab-pane.tpl');
var LayerHeaderView = require('./layer-header-view.js');
var LayerContentAnalysesView = require('./layer-content-views/layer-content-analyses-view');
var StyleView = require('../style/style-view');
var InfowindowsView = require('./layer-content-views/infowindows-view');
var TablesCollection = require('../../data/tables-collection');
var AnalysisSourceOptionsModel = require('./layer-content-views/analyses/analysis-source-options-model');
var AnalysisFormsCollection = require('./layer-content-views/analyses/analysis-forms-collection');
var TableManager = require('../../components/table/table-manager');
var changeViewButtons = require('./change-view-buttons.tpl');
var DataView = require('./layer-content-views/data/data-view');
var ViewFactory = require('../../components/view-factory');
var legendTemplate = require('./layer-content-views/legend/empty.tpl');

module.exports = CoreView.extend({
  events: {
    'click .js-back': '_onClickBack'
  },

  options: {
    analysisPayload: null // id or a new analysis node attrs (may not be complete)
  },

  initialize: function (opts) {
    if (!opts.userActions) throw new Error('userActions is required');
    if (!opts.analysisDefinitionNodesCollection) throw new Error('analysisDefinitionNodesCollection is required');
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.widgetDefinitionsCollection) throw new Error('widgetDefinitionsCollection is required');
    if (!opts.stackLayoutModel) throw new Error('StackLayoutModel is required');
    if (!opts.modals) throw new Error('modals is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.editorModel) throw new Error('editorModel is required');
    if (!opts.analysis) throw new Error('analysis is required');

    this.userActions = opts.userActions;
    this.analysisDefinitionNodesCollection = opts.analysisDefinitionNodesCollection;
    this.layerDefinitionModel = opts.layerDefinitionModel;
    this.layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this.widgetDefinitionsCollection = opts.widgetDefinitionsCollection;
    this.stackLayoutModel = opts.stackLayoutModel;
    this.modals = opts.modals;
    this._configModel = opts.configModel;
    this._editorModel = opts.editorModel;
    this.analysis = opts.analysis;

    this._firstNode = this.layerDefinitionModel.getAnalysisDefinitionNodeModel();

    // If primary node is a source node
    if (this._firstNode.get('type') === 'source') {
      this._tableNodeModel = this._firstNode.tableModel;
      this._tableNodeModel.once('change:synchronization', function () {
        var syncModel = this._tableNodeModel && this._tableNodeModel._syncModel;
        var isSync = syncModel && syncModel.isSync();
        if (isSync) {
          this._initTable();
        }
      }, this);
      this._firstNode.fetchTable();
    }

    this._initBinds();
  },

  render: function () {
    this._unbindEvents();
    this.clearSubViews();

    var self = this;
    var analysisPayload = this.options.analysisPayload;

    var tabPaneTabs = [{
      label: _t('editor.layers.menu-tab-pane-labels.data'),
      name: 'data',
      selected: !analysisPayload,
      createContentView: function () {
        return new DataView({
          className: 'Editor-content',
          widgetDefinitionsCollection: self.widgetDefinitionsCollection,
          layerDefinitionModel: self.layerDefinitionModel,
          stackLayoutModel: self.stackLayoutModel,
          userActions: self.userActions,
          configModel: self._configModel,
          editorModel: self._editorModel
        });
      }
    }, {
      label: _t('editor.layers.menu-tab-pane-labels.analyses'),
      name: 'analyses',
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
          userActions: self.userActions,
          configModel: self._configModel,
          layerDefinitionModel: self.layerDefinitionModel,
          analysisSourceOptionsModel: analysisSourceOptionsModel
        });
        analysisFormsCollection.resetByLayerDefinition();

        // e.g. when selected from layers view
        var selectedNodeId;
        if (_.isString(analysisPayload)) {
          selectedNodeId = analysisPayload;
        } else if (_.isObject(analysisPayload)) {
          // payload passed after continue when an option was selected in add-analysis-view
          selectedNodeId = analysisPayload.id;
          analysisFormsCollection.addHead(analysisPayload);
        } else {
          selectedNodeId = self.layerDefinitionModel.get('source');
        }
        analysisPayload = null; // remove payload once we have used it, to not have it being invoked again when switching tabs

        return new LayerContentAnalysesView({
          className: 'Editor-content',
          userActions: self.userActions,
          analysis: self.analysis,
          analysisFormsCollection: analysisFormsCollection,
          layerDefinitionModel: self.layerDefinitionModel,
          selectedNodeId: selectedNodeId
        });
      }
    }, {
      label: _t('editor.layers.menu-tab-pane-labels.style'),
      name: 'style',
      createContentView: function () {
        var lastLayerNodeModel = self.layerDefinitionModel.getAnalysisDefinitionNodeModel();
        return new StyleView({
          className: 'Editor-content',
          configModel: self._configModel,
          userActions: self.userActions,
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
      name: 'infowindow',
      createContentView: function () {
        return new InfowindowsView({
          className: 'Editor-content',
          userActions: self.userActions,
          layerDefinitionModel: self.layerDefinitionModel,
          querySchemaModel: self.layerDefinitionModel.getAnalysisDefinitionNodeModel().querySchemaModel,
          configModel: self._configModel,
          editorModel: self._editorModel
        });
      }
    }, {
      label: _t('editor.layers.menu-tab-pane-labels.legends'),
      name: 'legends',
      createContentView: function () {
        return ViewFactory.createByTemplate(
          legendTemplate,
          null,
          {
            className: 'Editor-content'
          }
        );
      }
    }];

    var layerHeaderView = new LayerHeaderView({
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      layerDefinitionModel: this.layerDefinitionModel,
      userActions: this.userActions,
      configModel: this._configModel,
      modals: this.modals,
      tableNodeModel: this._tableNodeModel,
      editorModel: this._editorModel
    });

    this.addView(layerHeaderView);
    this.$el.append(layerHeaderView.render().$el);

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

    this._initTable();

    return this;
  },

  _initBinds: function () {
    this.layerDefinitionsCollection.on('destroy', this._onClickBack, this);
    this.add_related_model(this.layerDefinitionsCollection);
    this.layerDefinitionModel.bind('change:source', this._initTable, this);
    this.add_related_model(this.layerDefinitionModel);
    this._editorModel.on('change:edition', this._changeStyle, this);
    this.add_related_model(this._editorModel);
  },

  _destroyTable: function () {
    this._tableView.clean();
    this.removeView(this._tableView);
    $('.js-mapTableView').remove();
    delete this._tableView;
  },

  _initTable: function () {
    if (this._tableView) {
      this._destroyTable();
    }

    var analysisDefinitionNodeModel = this.layerDefinitionModel.getAnalysisDefinitionNodeModel();
    var isSourceType = analysisDefinitionNodeModel.get('type') === 'source';
    var isSync = this._tableNodeModel && this._tableNodeModel._syncModel && this._tableNodeModel._syncModel.isSync();

    this._tableView = TableManager.create({
      querySchemaModel: analysisDefinitionNodeModel.querySchemaModel,
      tableName: analysisDefinitionNodeModel.get('table_name'),
      readonly: isSync || !isSourceType,
      modals: this.modals,
      configModel: this._configModel
    });
    this.addView(this._tableView);

    // TODO: check the behaviour, place and template of the buttons
    $('.CDB-Dashboard-canvas').append(
      changeViewButtons({
        isThereWidgets: this.widgetDefinitionsCollection.size()
      })
    );
    $('.js-showMap').bind('click', this._onMapClick.bind(this));
    $('.js-showTable').bind('click', this._onTableClick.bind(this));
  },

  _onMapClick: function (ev) {
    var isThereWidgets = this.widgetDefinitionsCollection.size();
    $('.js-mapTableView')
      .toggleClass('is-moved', !!isThereWidgets)
      .removeClass('in-table');
    $('.js-showTable').removeClass('is-selected');
    $('.js-showMap').addClass('is-selected');
    this._tableView.remove();
  },

  _onTableClick: function (ev) {
    $('.js-mapTableView')
      .removeClass('is-moved')
      .addClass('in-table');
    $('.js-showMap').removeClass('is-selected');
    $('.js-showTable').addClass('is-selected');
    $('.js-editor .CDB-Dashboard-canvas').append(this._tableView.render().el);
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
    this._editorModel.set({ edition: false });
    this.stackLayoutModel.prevStep('layers');
  },

  _changeStyle: function () {
    this._layerTabPaneView.changeStyleMenu(this._editorModel);
  },

  _quitEditing: function () {
    if (this._layerTabPaneView.getSelectedTabPaneName() !== 'style' &&
        this._layerTabPaneView.getSelectedTabPaneName() !== 'infowindow') {
      this._editorModel.set({ edition: false });
    }
  },

  clean: function () {
    $('.js-mapTableView').remove();
    CoreView.prototype.clean.apply(this);
  }
});
