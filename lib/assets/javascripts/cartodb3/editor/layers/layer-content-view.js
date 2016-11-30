var _ = require('underscore');
var $ = require('jquery');
var CoreView = require('backbone/core-view');
var createTextLabelsTabPane = require('../../components/tab-pane/create-text-labels-tab-pane');
var TabPaneTemplate = require('./layer-tab-pane.tpl');
var LayerHeaderView = require('./layer-header-view.js');
var LayerContentAnalysesView = require('./layer-content-views/analyses/analyses-view');
var StyleView = require('../style/style-view');
var InfowindowsView = require('./layer-content-views/infowindows-view');
var TablesCollection = require('../../data/tables-collection');
var AnalysisSourceOptionsModel = require('./layer-content-views/analyses/analysis-source-options-model');
var AnalysisFormsCollection = require('./layer-content-views/analyses/analysis-forms-collection');
var TableManager = require('../../components/table/table-manager');
var changeViewButtons = require('./change-view-buttons.tpl');
var DataView = require('./layer-content-views/data/data-view');
var LegendsView = require('./layer-content-views/legend/legends-view');
var FeatureDefinitionModel = require('../../data/feature-definition-model');
var TableNameUtils = require('../../helpers/table-name-utils');

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
  'stateDefinitionModel'
];

module.exports = CoreView.extend({
  events: {
    'click .js-back': '_onClickBack',
    'click .js-fix-sql': '_onClickFixSQL'
  },

  options: {
    analysisPayload: null // id or a new analysis node attrs (may not be complete)
  },

  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (opts[item] === undefined) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);

    this._firstNode = this._getAnalysisDefinitionNodeModel();

    if (this._firstNode.isSourceType()) {
      this._tableNodeModel = this._firstNode.getTableModel();
      var isSync = this._tableNodeModel && this._tableNodeModel.isSync();

      this._tableNodeModel.once('change:synchronization', function () {
        if (isSync) {
          this._initTable();
        }
      }, this);
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
          widgetDefinitionsCollection: self._widgetDefinitionsCollection,
          layerDefinitionModel: self._layerDefinitionModel,
          stackLayoutModel: self._stackLayoutModel,
          userActions: self._userActions,
          configModel: self._configModel,
          editorModel: self._editorModel,
          userModel: self._userModel
        });
      }
    }, {
      label: _t('editor.layers.menu-tab-pane-labels.analyses'),
      name: 'analyses',
      selected: !!analysisPayload,
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
        analysisPayload = null; // remove payload once we have used it, to not have it being invoked again when switching tabs

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
          selectedNodeId: selectedNodeId
        });
      }
    }, {
      label: _t('editor.layers.menu-tab-pane-labels.style'),
      name: 'style',
      createContentView: function () {
        return new StyleView({
          className: 'Editor-content',
          configModel: self._configModel,
          userActions: self._userActions,
          analysisDefinitionsCollection: self.analysisDefinitionsCollection,
          queryGeometryModel: self._getQueryGeometryModel(),
          querySchemaModel: self._getQuerySchemaModel(),
          layerDefinitionsCollection: self._layerDefinitionsCollection,
          layerDefinitionModel: self._layerDefinitionModel,
          editorModel: self._editorModel,
          modals: self._modals
        });
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
          legendDefinitionsCollection: self._legendDefinitionsCollection,
          editorModel: self._editorModel
        });
      }
    }];

    var layerHeaderView = new LayerHeaderView({
      layerDefinitionsCollection: this._layerDefinitionsCollection,
      layerDefinitionModel: this._layerDefinitionModel,
      userActions: this._userActions,
      configModel: this._configModel,
      modals: this._modals,
      tableNodeModel: this._tableNodeModel,
      editorModel: this._editorModel,
      stateDefinitionModel: this._stateDefinitionModel
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
    this._layerDefinitionsCollection.on('destroy', this._onClickBack, this);
    this.add_related_model(this._layerDefinitionsCollection);

    this._layerDefinitionModel.bind('change:source', this._initTable, this);
    this._layerDefinitionModel.bind('change:source', this._renderContextButtons, this);
    this._layerDefinitionModel.bind('change:visible', this._renderContextButtons, this);
    this.add_related_model(this._layerDefinitionModel);

    this._editorModel.on('change:edition', this._changeStyle, this);
    this.add_related_model(this._editorModel);

    this._widgetDefinitionsCollection.bind('add remove', this._renderContextButtons, this);
    this.add_related_model(this._widgetDefinitionsCollection);

    this._getQuerySchemaModel().on('change:query', this._renderContextButtons, this);
    this.add_related_model(this._getQuerySchemaModel());

    this._onboardings.bind('style', function () {
      this._layerTabPaneView.collection.select('name', 'style');
    }, this);
    this.add_related_model(this._onboardings);

    // Fetch geometry type if there isn't one yet
    var queryGeometryModel = this._getQueryGeometryModel();
    if (!queryGeometryModel.hasValue()) {
      queryGeometryModel.once('change:simple_geom', function (mdl, simpleGeom) {
        // Reset styles form in order to prevent a sync problem with styles
        this._layerDefinitionModel.styleModel.setDefaultPropertiesByType('simple', simpleGeom, true);
        this._renderContextButtons();
      }, this);
      this.add_related_model(queryGeometryModel);
      queryGeometryModel.fetch();
    }
  },

  _destroyTable: function () {
    this._tableView.clean();
    this.removeView(this._tableView);
    delete this._tableView;
    this._destroyContextButtons();
  },

  _initTable: function () {
    if (this._tableView) {
      this._destroyTable();
    }

    var analysisDefinitionNodeModel = this._getAnalysisDefinitionNodeModel();
    var isSourceType = analysisDefinitionNodeModel.get('type') === 'source';
    var isSync = this._tableNodeModel && this._tableNodeModel.isSync();
    var hasWriteAccess = this._tableNodeModel && this._tableNodeModel.hasWriteAccess();

    // Adds the owner username if it's in an organization and the table name is not already qualified
    var tableName = analysisDefinitionNodeModel.get('table_name');
    var userName = TableNameUtils.getUsername(tableName) || this._userModel.get('username');
    tableName = TableNameUtils.getQualifiedTableName(
      tableName,
      userName,
      this._userModel.isInsideOrg()
    );

    this._tableView = TableManager.create({
      queryGeometryModel: this._getQueryGeometryModel(),
      querySchemaModel: this._getQuerySchemaModel(),
      tableName: tableName,
      readonly: isSync || !isSourceType || !hasWriteAccess,
      modals: this._modals,
      configModel: this._configModel
    });
    this.addView(this._tableView);

    this._renderContextButtons();
  },

  _renderContextButtons: function () {
    this._destroyContextButtons();

    var analysisDefinitionNodeModel = this._getAnalysisDefinitionNodeModel();
    var isSourceType = analysisDefinitionNodeModel.get('type') === 'source';
    var isSync = this._tableNodeModel && this._tableNodeModel.isSync();
    var isReadOnly = isSync || !isSourceType || this._layerDefinitionModel.isCustomQueryApplied();
    var queryGeometryModel = this._getQueryGeometryModel();

    // TODO: check the behaviour, place and template of the buttons
    $('.CDB-Dashboard-canvas').append(
      changeViewButtons({
        isThereOtherWidgets: this._widgetDefinitionsCollection.isThereOtherWidgets(),
        isThereTimeSeries: this._widgetDefinitionsCollection.isThereTimeSeries(),
        isThereAnimatedTimeSeries: this._widgetDefinitionsCollection.isThereTimeSeries({ animated: true }),
        queryGeometryModel: queryGeometryModel.get('simple_geom'),
        isSourceType: isSourceType,
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
    $('.js-mapTableView')
      .toggleClass('has-timeSeries', this._widgetDefinitionsCollection.isThereTimeSeries())
      .toggleClass('is-moved', this._widgetDefinitionsCollection.isThereOtherWidgets());
    $('.js-mapTableView')
      .removeClass('in-table');
    $('.js-showTable').removeClass('is-selected');
    $('.js-showMap').addClass('is-selected');
    this._tableView.remove();
  },

  _onTableClick: function (ev) {
    $('.js-mapTableView')
      .removeClass('is-moved')
      .removeClass('has-timeSeries');
    $('.js-mapTableView')
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

  clean: function () {
    this._destroyContextButtons();
    CoreView.prototype.clean.apply(this);
  }
});
