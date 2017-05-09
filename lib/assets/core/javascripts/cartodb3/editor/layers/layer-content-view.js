var _ = require('underscore');
var $ = require('jquery');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var createTextLabelsTabPane = require('../../components/tab-pane/create-text-labels-tab-pane');
var TabPaneTemplate = require('./layer-tab-pane.tpl');
var LayerHeaderView = require('./layer-header-view.js');
var LayerContentAnalysesView = require('./layer-content-views/analyses/analyses-view');
var StyleView = require('../style/style-view');
var InfowindowsView = require('./layer-content-views/infowindow/infowindows-view');
var TablesCollection = require('../../data/tables-collection');
var AnalysisSourceOptionsModel = require('./layer-content-views/analyses/analysis-source-options-model');
var AnalysisFormsCollection = require('./layer-content-views/analyses/analysis-forms-collection');
var TableManager = require('../../components/table/table-manager');
var changeViewButtons = require('./change-view-buttons.tpl');
var DataView = require('./layer-content-views/data/data-view');
var LegendsView = require('./layer-content-views/legend/legends-view');
var FeatureDefinitionModel = require('../../data/feature-definition-model');
var AnalysesService = require('./layer-content-views/analyses/analyses-service');
var checkAndBuildOpts = require('../../helpers/required-opts');

var REQUIRED_OPTS = [
  'userActions',
  'analysisDefinitionNodesCollection',
  'layerDefinitionsCollection',
  'layerDefinitionModel',
  'widgetDefinitionsCollection',
  'legendDefinitionsCollection',
  'stackLayoutModel',
  'modals',
  'onboardings',
  'configModel',
  'editorModel',
  'userModel',
  'mapDefinitionModel',
  'mapModeModel',
  'visDefinitionModel',
  'stateDefinitionModel',
  'onboardingNotification'
];

module.exports = CoreView.extend({
  events: {
    'click .js-back': '_onClickBack',
    'click .js-fix-sql': '_onClickFixSQL'
  },

  options: {
    selectedTabItem: null,
    analysisPayload: null // id or a new analysis node attrs (may not be complete)
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this.model = new Backbone.Model({
      context: 'map' // map or table
    });

    this._styleViewId = null;

    AnalysesService.setLayerId(this._layerDefinitionModel.get('id'));

    this._initBinds();
  },

  render: function () {
    this._unbindEvents();
    this.clearSubViews();
    this._destroyTable();
    this.$el.empty();

    var self = this;
    var selectedTabItem = this.options.selectedTabItem;
    var analysisPayload = this.options.analysisPayload;
    var analysisDefinitionNodeModel = this._getAnalysisDefinitionNodeModel();
    var tableNodeModel = analysisDefinitionNodeModel.isSourceType() && analysisDefinitionNodeModel.getTableModel();

    var tabPaneTabs = [{
      label: _t('editor.layers.menu-tab-pane-labels.data'),
      name: 'data',
      selected: (!selectedTabItem || selectedTabItem === 'data'),
      createContentView: function () {
        return new DataView({
          className: 'Editor-content',
          widgetDefinitionsCollection: self._widgetDefinitionsCollection,
          layerDefinitionModel: self._layerDefinitionModel,
          stackLayoutModel: self._stackLayoutModel,
          userActions: self._userActions,
          configModel: self._configModel,
          editorModel: self._editorModel,
          userModel: self._userModel,
          onboardings: self._onboardings,
          onboardingNotification: self._onboardingNotification
        });
      }
    }, {
      label: _t('editor.layers.menu-tab-pane-labels.analyses'),
      name: 'analyses',
      selected: (selectedTabItem && selectedTabItem === 'analyses') && !!analysisPayload,
      createContentView: function () {
        var analysisSourceOptionsModel = new AnalysisSourceOptionsModel(null, {
          analysisDefinitionNodesCollection: self._analysisDefinitionNodesCollection,
          layerDefinitionsCollection: self._layerDefinitionsCollection,
          tablesCollection: new TablesCollection(null, {
            configModel: self._configModel
          })
        });
        analysisSourceOptionsModel.fetch();

        var analysisFormsCollection = new AnalysisFormsCollection(null, {
          userActions: self._userActions,
          configModel: self._configModel,
          layerDefinitionModel: self._layerDefinitionModel,
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
          selectedNodeId = self._layerDefinitionModel.get('source');
        }

        // remove payload once we have used it, to not have it being invoked again when switching tabs
        selectedTabItem = null;
        analysisPayload = null;

        return new LayerContentAnalysesView({
          className: 'Editor-content',
          userActions: self._userActions,
          analysisDefinitionNodesCollection: self._analysisDefinitionNodesCollection,
          editorModel: self._editorModel,
          userModel: self._userModel,
          analysisFormsCollection: analysisFormsCollection,
          configModel: self._configModel,
          layerDefinitionModel: self._layerDefinitionModel,
          stackLayoutModel: self._stackLayoutModel,
          selectedNodeId: selectedNodeId,
          onboardings: self._onboardings,
          onboardingNotification: self._onboardingNotification
        });
      }
    }, {
      label: _t('editor.layers.menu-tab-pane-labels.style'),
      name: 'style',
      selected: selectedTabItem && selectedTabItem === 'style',
      createContentView: function () {
        // remove payload once we have used it, to not have it being invoked again when switching tabs
        selectedTabItem = null;

        var styleView = new StyleView({
          className: 'Editor-content',
          configModel: self._configModel,
          userModel: self._userModel,
          userActions: self._userActions,
          analysisDefinitionsCollection: self.analysisDefinitionsCollection,
          queryGeometryModel: self._getQueryGeometryModel(),
          querySchemaModel: self._getQuerySchemaModel(),
          queryRowsCollection: self._getQueryRowsCollection(),
          layerDefinitionsCollection: self._layerDefinitionsCollection,
          layerDefinitionModel: self._layerDefinitionModel,
          editorModel: self._editorModel,
          modals: self._modals,
          onboardings: self._onboardings,
          onboardingNotification: self._onboardingNotification
        });

        self._styleViewId = styleView.cid;
        return styleView;
      }
    }, {
      label: _t('editor.layers.menu-tab-pane-labels.infowindow'),
      name: 'infowindow',
      createContentView: function () {
        var nodeDefModel = self._layerDefinitionModel.getAnalysisDefinitionNodeModel();
        return new InfowindowsView({
          className: 'Editor-content',
          userActions: self._userActions,
          layerDefinitionModel: self._layerDefinitionModel,
          queryGeometryModel: nodeDefModel.queryGeometryModel,
          querySchemaModel: nodeDefModel.querySchemaModel,
          queryRowsCollection: nodeDefModel.queryRowsCollection,
          configModel: self._configModel,
          editorModel: self._editorModel
        });
      }
    }, {
      label: _t('editor.layers.menu-tab-pane-labels.legends'),
      name: 'legends',
      createContentView: function () {
        var nodeDefModel = self._layerDefinitionModel.getAnalysisDefinitionNodeModel();
        return new LegendsView({
          className: 'Editor-content',
          mapDefinitionModel: self._mapDefinitionModel,
          userActions: self._userActions,
          layerDefinitionModel: self._layerDefinitionModel,
          queryGeometryModel: nodeDefModel.queryGeometryModel,
          querySchemaModel: nodeDefModel.querySchemaModel,
          queryRowsCollection: nodeDefModel.queryRowsCollection,
          legendDefinitionsCollection: self._legendDefinitionsCollection,
          editorModel: self._editorModel,
          userModel: self._userModel,
          configModel: self._configModel,
          modals: self._modals
        });
      }
    }];

    var layerHeaderView = new LayerHeaderView({
      layerDefinitionsCollection: this._layerDefinitionsCollection,
      layerDefinitionModel: this._layerDefinitionModel,
      userActions: this._userActions,
      configModel: this._configModel,
      modals: this._modals,
      tableNodeModel: tableNodeModel,
      editorModel: this._editorModel,
      stateDefinitionModel: this._stateDefinitionModel,
      visDefinitionModel: this._visDefinitionModel,
      userModel: this._userModel,
      widgetDefinitionsCollection: this._widgetDefinitionsCollection
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
    this.$el.append(this._layerTabPaneView.render().el);
    this.addView(this._layerTabPaneView);

    this._layerTabPaneView.$el.addClass('js-editorPanelContent');
    this._renderContextButtons();

    return this;
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change:context', this._renderContextButtons);

    this.listenTo(this._layerDefinitionModel, 'remove', this._onClickBack);
    this.listenTo(this._layerDefinitionModel, 'change:source', function () {
      if (this.model.get('context') === 'table') {
        this._initTable();
      }

      this._renderContextButtons();
    }.bind(this));
    this.listenTo(this._layerDefinitionModel, 'change:visible', this._renderContextButtons);

    this.listenTo(this._editorModel, 'change:edition', this._changeStyle);

    this.listenTo(this._widgetDefinitionsCollection, 'add remove', this._renderContextButtons);

    this.listenTo(this._getQuerySchemaModel(), 'change:query', this._renderContextButtons);

    this.listenTo(this._onboardings, 'style', function () {
      this._layerTabPaneView.collection.select('name', 'style');
    });

    // Fetch geometry type if there isn't one yet
    var queryGeometryModel = this._getQueryGeometryModel();
    if (queryGeometryModel.shouldFetch()) {
      queryGeometryModel.once('change:simple_geom', function (mdl, simpleGeom) {
        // Reset styles form in order to prevent a sync problem with styles
        if (mdl.hasValue()) {
          this._layerDefinitionModel.styleModel.setDefaultPropertiesByType('simple', simpleGeom, true);
          this.render();
        }
        this._renderContextButtons();
      }, this);
      this.add_related_model(queryGeometryModel);
      queryGeometryModel.fetch();
    }
  },

  _destroyTable: function () {
    if (this._tableView) {
      TableManager.destroy(this._tableView);
      delete this._tableView;
    }
  },

  _initTable: function () {
    if (this._tableView) {
      this._destroyTable();
    }

    this._tableView = TableManager.create({
      analysisDefinitionNodeModel: this._getAnalysisDefinitionNodeModel(),
      configModel: this._configModel,
      modals: this._modals,
      userModel: this._userModel
    });

    $('.js-editor .CDB-Dashboard-canvas').append(this._tableView.render().el);
  },

  _renderContextButtons: function () {
    this._destroyContextButtons();

    var analysisDefinitionNodeModel = this._getAnalysisDefinitionNodeModel();
    var isReadOnly = analysisDefinitionNodeModel.isReadOnly();
    var queryGeometryModel = this._getQueryGeometryModel();

    $('.CDB-Dashboard-canvas').append(
      changeViewButtons({
        context: this.model.get('context'),
        isThereOtherWidgets: this._widgetDefinitionsCollection.isThereOtherWidgets(),
        isThereTimeSeries: this._widgetDefinitionsCollection.isThereTimeSeries(),
        isThereAnimatedTimeSeries: this._widgetDefinitionsCollection.isThereTimeSeries({ animated: true }),
        queryGeometryModel: queryGeometryModel.get('simple_geom'),
        isSourceType: analysisDefinitionNodeModel.isSourceType(),
        isVisible: this._layerDefinitionModel.get('visible'),
        isReadOnly: isReadOnly
      })
    );
    $('.js-showMap').bind('click', this._onMapClick.bind(this));
    $('.js-showTable').bind('click', this._onTableClick.bind(this));
    $('.js-newGeometry').bind('click', this._onClickNewGeometry.bind(this));
  },

  _destroyContextButtons: function () {
    $('.js-mapTableView').remove();
    $('.js-newGeometryView').remove();
  },

  _onMapClick: function (ev) {
    var currentContext = this.model.get('context');
    if (currentContext !== 'map') {
      this._destroyTable();
      this.model.set('context', 'map');
    }
  },

  _onTableClick: function (ev) {
    var currentContext = this.model.get('context');
    if (currentContext !== 'table') {
      this._initTable();
      this.model.set('context', 'table');
    }
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
    this._stackLayoutModel.prevStep('layers');
  },

  _onClickNewGeometry: function (ev) {
    var $target = $(ev.target).closest('.js-newGeometry');
    var featureType = $target.data('feature-type');

    if ($target.closest('.js-newGeometryItem').hasClass('is-disabled')) return false;

    var editOverlayText = _t('editor.edit-feature.overlay-text', { featureType: _t('editor.edit-feature.features.' + featureType) });

    $('.js-editOverlay-text').html(editOverlayText);
    $('.js-editOverlay').fadeIn(200, function () {
      $('.js-editOverlay').removeClass('is-hidden');
    });

    var feature = this._newFeatureDefinitionModel({ featureType: featureType });
    this._mapModeModel.enterDrawingFeatureMode(feature);
  },

  _newFeatureDefinitionModel: function (opts) {
    return new FeatureDefinitionModel({}, {
      configModel: this._configModel,
      layerDefinitionModel: this._layerDefinitionModel,
      userModel: this._userModel,
      featureType: opts.featureType
    });
  },

  _onClickFixSQL: function () {
    this._editorModel.set({edition: false}, {silent: true});
    this._layerTabPaneView.getTabPane('data').set({selected: true});
  },

  _changeStyle: function () {
    this._layerTabPaneView.changeStyleMenu(this._editorModel);
  },

  _quitEditing: function () {
    if (this._layerTabPaneView.getSelectedTabPaneName() !== 'style' &&
        this._layerTabPaneView.getSelectedTabPaneName() !== 'infowindow' &&
        this._layerTabPaneView.getSelectedTabPaneName() !== 'legends') {
      this._editorModel.set({ edition: false });
    }
  },

  _getAnalysisDefinitionNodeModel: function () {
    return this._layerDefinitionModel.getAnalysisDefinitionNodeModel();
  },

  _getQueryGeometryModel: function () {
    return this._getAnalysisDefinitionNodeModel().queryGeometryModel;
  },

  _getQuerySchemaModel: function () {
    return this._getAnalysisDefinitionNodeModel().querySchemaModel;
  },

  _getQueryRowsCollection: function () {
    return this._getAnalysisDefinitionNodeModel().queryRowsCollection;
  },

  clean: function () {
    this._destroyContextButtons();
    this._destroyTable();
    CoreView.prototype.clean.apply(this);
  }
});
