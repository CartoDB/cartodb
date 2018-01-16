var _ = require('underscore');
var $ = require('jquery');
var Backbone = require('backbone');
var AnalysisDefinitionNodeSourceModel = require('../../../../../javascripts/cartodb3/data/analysis-definition-node-source-model');
var LayerDefinitionsCollection = require('../../../../../javascripts/cartodb3/data/layer-definitions-collection');
var LayerDefinitionModel = require('../../../../../javascripts/cartodb3/data/layer-definition-model');
var LayerContentView = require('../../../../../javascripts/cartodb3/editor/layers/layer-content-view');
var ConfigModel = require('../../../../../javascripts/cartodb3/data/config-model');
var UserModel = require('../../../../../javascripts/cartodb3/data/user-model');
var EditorModel = require('../../../../../javascripts/cartodb3/data/editor-model');
var UserNotifications = require('../../../../../javascripts/cartodb3/data/user-notifications');
var AnalysesService = require('../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analyses-service');
var FactoryModals = require('../../factories/modals');
var Router = require('../../../../../javascripts/cartodb3/routes/router');

describe('editor/layers/layer-content-view/layer-content-view', function () {
  var dashboardCanvasEl;
  var handleRouteSpy;
  var analysesTabName = 'analyses';
  var dataTabName = 'data';

  beforeEach(function () {
    dashboardCanvasEl = document.createElement('div');
    dashboardCanvasEl.className = 'CDB-Dashboard-canvas';
    document.body.appendChild(dashboardCanvasEl);

    var canvas = document.createElement('div');
    canvas.classList.add('CDB-Map-canvas');
    dashboardCanvasEl.appendChild(canvas);

    var configModel = new ConfigModel({
      base_url: '/u/pepe',
      user_name: 'pepe',
      sql_api_protocol: 'http'
    });

    this.userModel = new UserModel({}, {
      configModel: configModel,
      username: 'pepe'
    });

    this.mapDefModel = new Backbone.Model({
      legends: true
    });

    this.layer = new LayerDefinitionModel({
      id: 'l-1',
      options: {
        type: 'CartoDB',
        table_name: 'foo'
      }
    }, {
      parse: true,
      configModel: configModel
    });

    var onboardings = new Backbone.Model();
    onboardings.create = function () {};
    onboardings.destroy = function () {};

    this.analysisDefinitionNodeModel = new AnalysisDefinitionNodeSourceModel({
      id: 'a0',
      type: 'source',
      table_name: 'foo'
    }, {
      configModel: configModel,
      userModel: this.userModel,
      collection: new Backbone.Collection()
    });

    this.analysisDefinitionNodeModel.querySchemaModel.attributes.query = 'SELECT * FROM foo';

    this.layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
      configModel: configModel,
      userModel: this.userModel,
      analysisDefinitionNodesCollection: new Backbone.Collection(),
      mapId: 'map-123',
      stateDefinitionModel: {}
    });

    this.layerDefinitionsCollection.add(this.layer);

    this.widgetDefinitionsCollection = new Backbone.Collection();
    this.widgetDefinitionsCollection.isThereTimeSeries = function () {
      return false;
    };
    this.widgetDefinitionsCollection.isThereOtherWidgets = function () {
      return false;
    };

    spyOn(this.layer, 'getAnalysisDefinitionNodeModel').and.returnValue(this.analysisDefinitionNodeModel);
    spyOn(this.layer, 'findAnalysisDefinitionNodeModel').and.returnValue(this.analysisDefinitionNodeModel);
    spyOn(Router, 'goToLayerList');
    spyOn(Router, 'navigate');
    handleRouteSpy = spyOn(LayerContentView.prototype, 'handleRoute');

    var onboardingNotification = new UserNotifications({}, {
      key: 'builder',
      configModel: configModel
    });
    this.visDefinitionModel = new Backbone.Model();
    this.stackLayoutModel = jasmine.createSpyObj('stackLayoutModel', ['prevStep', 'goToStep']);

    AnalysesService.init({
      onboardings: onboardings,
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      modals: FactoryModals.createModalService(),
      userModel: this.userModel,
      configModel: configModel
    });

    this.editorModel = new EditorModel({ edition: false });

    this.view = new LayerContentView({
      mapDefinitionModel: this.mapDefModel,
      layerDefinitionModel: this.layer,
      analysisDefinitionsCollection: new Backbone.Collection(),
      analysisDefinitionNodesCollection: new Backbone.Collection(),
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      legendDefinitionsCollection: new Backbone.Collection(),
      widgetDefinitionsCollection: this.widgetDefinitionsCollection,
      userModel: this.userModel,
      modals: FactoryModals.createModalService(),
      onboardings: onboardings,
      analysis: {},
      userActions: {},
      vis: {},
      stackLayoutModel: this.stackLayoutModel,
      configModel: configModel,
      editorModel: this.editorModel,
      mapModeModel: jasmine.createSpyObj('mapModeModel', ['enterDrawingFeatureMode']),
      stateDefinitionModel: {},
      onboardingNotification: onboardingNotification,
      visDefinitionModel: this.visDefinitionModel
    });

    this.view.render();
  });

  describe('.render', function () {
    it('should render correctly', function () {
      expect(_.size(this.view._subviews)).toBe(3); // [Header, Placeholder, Geometry Toolips]
      expect(this.view.$('.Editor-HeaderInfo-titleText').text()).toContain('foo');
    });
  });

  describe('when all query objects are loaded', function () {
    beforeEach(function () {
      spyOn(this.analysisDefinitionNodeModel.querySchemaModel, 'isDone').and.returnValue(true);
      spyOn(this.analysisDefinitionNodeModel.queryGeometryModel, 'isDone').and.returnValue(true);
      spyOn(this.analysisDefinitionNodeModel.queryRowsCollection, 'isDone').and.returnValue(true);
    });

    describe('.render', function () {
      it('should render correctly', function () {
        this.view.render();

        expect(_.size(this.view._subviews)).toBe(3); // [Header, TabPane, Geometry Toolips]
        expect(this.view.$('.Editor-HeaderInfo-titleText').text()).toContain('foo');
        expect(this.view.$('.CDB-NavMenu .CDB-NavMenu-item').length).toBe(5);
        // Onboarding
        expect(this.view.$('.js-editorPanelContent').length).toBe(1);
      });
    });

    describe('when can be georeferenced', function () {
      beforeEach(function () {
        spyOn(this.view._layerDefinitionModel, 'canBeGeoreferenced').and.returnValue(true);
        spyOn(this.view._layerDefinitionModel, 'isEmpty').and.returnValue(false);
        this.view.render();
      });

      it('should disable tabs', function () {
        expect(this.view.$el.find('.CDB-NavMenu-item.is-disabled').length).toBe(3);
      });

      it('should select the analysis tab', function () {
        expect(this.view._layerTabPaneView.getSelectedTabPaneName()).toBe(analysesTabName);
      });
    });

    describe('when analysisDefinitionNodeModel has errors', function () {
      beforeEach(function () {
        spyOn(this.view._layerDefinitionModel, 'isEmpty').and.returnValue(true);
        spyOn(this.analysisDefinitionNodeModel, 'hasFailed').and.returnValue(true);

        this.view.render();
      });

      it('should disable tabs', function () {
        expect(this.view.$el.find('.CDB-NavMenu-item.is-disabled').length).toBe(3);
      });

      it('should select the analysis tab', function () {
        expect(this.view._layerTabPaneView.getSelectedTabPaneName()).toBe(analysesTabName);
      });
    });

    describe('when is empty', function () {
      it('should disable tabs', function () {
        spyOn(this.view._layerDefinitionModel, 'canBeGeoreferenced').and.returnValue(true);
        spyOn(this.view._layerDefinitionModel, 'isEmpty').and.returnValue(true);

        this.view.render();

        expect(this.view.$el.find('.CDB-NavMenu-item.is-disabled').length).toBe(4); // All but data
      });

      it('should select the data tab', function () {
        expect(this.view._layerTabPaneView.getSelectedTabPaneName()).toBe(dataTabName);
      });
    });
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  describe('._onClickBack', function () {
    it('should call goToLayerList in Router', function () {
      this.view.$('.js-back').click();

      expect(Router.goToLayerList).toHaveBeenCalled();
    });

    it('should set editorModel edition to false', function () {
      this.editorModel.set('edition', true, { silent: true });

      this.view.$('.js-back').click();

      expect(this.editorModel.get('edition')).toBe(false);
    });
  });

  describe('.handleRoute', function () {
    it('should create editOverlay', function () {
      handleRouteSpy.and.callThrough();
      var routeModel = new Backbone.Model({
        currentRoute: ['add_feature_']
      });
      this.view.handleRoute(routeModel);

      expect($(dashboardCanvasEl).find('.js-editOverlay').length).toBe(1);
    });
  });

  describe('._renderContextButtons', function () {
    var analysisDefNodeModel;
    var layerDefinitionModel;
    var queryGeometryModel;
    var needsGeoSpy;
    var isEmptySpy;

    function hasTipsy (subviews) {
      var newGeomItems = _.filter(subviews, function (elem) {
        return elem.el.classList.contains('js-newGeometryView');
      });

      if (newGeomItems.length === 0) return false;

      return newGeomItems.reduce(function (hasTipsy, btn) {
        return btn.tipsy && hasTipsy;
      }, true);
    }

    beforeEach(function () {
      analysisDefNodeModel = this.view._getAnalysisDefinitionNodeModel();
      layerDefinitionModel = this.view._layerDefinitionModel;
      queryGeometryModel = this.view._getQueryGeometryModel();

      spyOn(analysisDefNodeModel, 'isReadOnly');
      needsGeoSpy = spyOn(this.view._layerDefinitionModel, 'canBeGeoreferenced');
      isEmptySpy = spyOn(this.view._layerDefinitionModel, 'isEmpty');

      this.view._renderContextButtons();
    });

    afterEach(function () {
      this.view._destroyContextButtons();
    });

    it('shouldn\'t disable tabs', function () {
      needsGeoSpy.and.returnValue(false);
      isEmptySpy.and.returnValue(false);

      this.view.render();

      expect(this.view.$el.find('.CDB-NavMenu-item.is-disabled').length).toBe(0);
    });

    it('should not create editOverlay tip view', function () {
      expect($(dashboardCanvasEl).find('js-editOverlay').length).toBe(0);
    });

    it('should navigate when click on new geometry', function () {
      queryGeometryModel.set('simple_geom', 'point');
      analysisDefNodeModel.isReadOnly.and.returnValue(false);
      layerDefinitionModel.set('visible', true);
      this.view._renderContextButtons();

      $(dashboardCanvasEl).find('.js-newGeometry').trigger('click');

      expect(Router.navigate).toHaveBeenCalled();
    });

    it('should render context switch toggler properly', function () {
      expect($(dashboardCanvasEl).find('.Editor-contextSwitcher.js-mapTableView').length).toBe(1);
    });

    it('should render geometry buttons properly', function () {
      expect($(dashboardCanvasEl).find('.Editor-contextSwitcherItem.js-newGeometryItem').length).toBe(3);
    });

    it('should disable edit geometry buttons when node is read only and visible', function () {
      analysisDefNodeModel.isReadOnly.and.returnValue(true);
      layerDefinitionModel.set('visible', true);
      expect($(dashboardCanvasEl).find('.Editor-contextSwitcherItem.js-newGeometryItem.is-disabled').length).toBe(3);
    });

    it('should disable edit geometry buttons when node is read only and not visible', function () {
      analysisDefNodeModel.isReadOnly.and.returnValue(true);
      layerDefinitionModel.set('visible', false);
      expect($(dashboardCanvasEl).find('.Editor-contextSwitcherItem.js-newGeometryItem.is-disabled').length).toBe(3);
    });

    it('should disable edit geometry buttons when node is neither visible nor read only', function () {
      analysisDefNodeModel.isReadOnly.and.returnValue(false);
      layerDefinitionModel.set('visible', false);
      expect($(dashboardCanvasEl).find('.Editor-contextSwitcherItem.js-newGeometryItem.is-disabled').length).toBe(3);
    });

    it('should not disable edit geometry buttons when node is visible and not read only', function () {
      analysisDefNodeModel.isReadOnly.and.returnValue(false);
      layerDefinitionModel.set('visible', true);
      expect($(dashboardCanvasEl).find('.Editor-contextSwitcherItem.js-newGeometryItem.is-disabled').length).toBe(0);
    });

    it('should add tipsy subview when not visible or read only', function () {
      this.view.clearSubViews();
      analysisDefNodeModel.isReadOnly.and.returnValue(true);
      layerDefinitionModel.set('visible', false);
      expect(hasTipsy(this.view._subviews)).toBe(true);
    });

    it('should not add tipsy subview when not visible or read only', function () {
      this.view.clearSubViews();
      analysisDefNodeModel.isReadOnly.and.returnValue(false);
      layerDefinitionModel.set('visible', true);
      expect(hasTipsy(this.view._subviews)).toBe(false);
    });

    it('should display only one button per geometry', function () {
      queryGeometryModel.set('simple_geom', 'polygon');
      this.view._renderContextButtons();
      expect($(dashboardCanvasEl).find('.Editor-contextSwitcherItem.js-newGeometryItem').length).toBe(1);
    });

    it('should show the button for the simple_geom type', function () {
      queryGeometryModel.set('simple_geom', 'point');
      this.view._renderContextButtons();
      expect($(dashboardCanvasEl).find('.js-newGeometry[data-feature-type="point"]').length).toBe(1);

      queryGeometryModel.set('simple_geom', 'line');
      this.view._renderContextButtons();
      expect($(dashboardCanvasEl).find('.js-newGeometry[data-feature-type="line"]').length).toBe(1);

      queryGeometryModel.set('simple_geom', 'polygon');
      this.view._renderContextButtons();
      expect($(dashboardCanvasEl).find('.js-newGeometry[data-feature-type="polygon"]').length).toBe(1);
    });
  });

  describe('._initBinds', function () {
    function buildResponse (geom) {
      return {
        status: 200,
        contentType: 'application/json; charset=utf-8',
        responseText: '{"rows":[{"the_geom":"' + geom + '"}],"time":0.005,"fields":{"the_geom":{"type":"string"}},"total_rows":1}'
      };
    }

    beforeEach(function () {
      jasmine.Ajax.install();
    });

    afterEach(function () {
      jasmine.Ajax.uninstall();
    });

    it('should call _renderContextButtons and set default style properties if there is a change in simple_geom to a valid value', function () {
      var queryGeometryModel = this.view._getQueryGeometryModel();
      queryGeometryModel.set('status', 'unfetched');
      queryGeometryModel.set('simple_geom', 'point');
      queryGeometryModel.set('query', 'SELECT TOP 10 FROM fake_table;');
      spyOn(this.view, '_renderContextButtons');
      spyOn(this.view, 'render');
      spyOn(this.view._layerDefinitionModel.styleModel, 'setDefaultPropertiesByType');
      jasmine.Ajax.stubRequest(/sql/)
        .andReturn(buildResponse('polygon'));
      this.view._initBinds();

      queryGeometryModel.set('simple_geom', 'polygon');

      expect(this.view._layerDefinitionModel.styleModel.setDefaultPropertiesByType).toHaveBeenCalled();
      expect(this.view.render).toHaveBeenCalled();
      expect(this.view._renderContextButtons).toHaveBeenCalled();
    });

    it('should call _renderContextButtons and not set default style properties if there is a change in simple_geom to nothing', function () {
      var queryGeometryModel = this.view._getQueryGeometryModel();
      queryGeometryModel.set('status', 'unfetched');
      queryGeometryModel.set('simple_geom', 'point');
      queryGeometryModel.set('query', 'SELECT TOP 10 FROM fake_table;');
      spyOn(this.view, '_renderContextButtons');
      spyOn(this.view._layerDefinitionModel.styleModel, 'setDefaultPropertiesByType');
      jasmine.Ajax.stubRequest(/sql/)
        .andReturn(buildResponse(''));
      this.view._initBinds();

      queryGeometryModel.set('simple_geom', '');

      expect(this.view._layerDefinitionModel.styleModel.setDefaultPropertiesByType).not.toHaveBeenCalled();
      expect(this.view._renderContextButtons).toHaveBeenCalled();
    });

    it('should call _onTogglerChanged if togglerModel:active changes', function () {
      spyOn(this.view, '_onTogglerChanged');
      this.view._initBinds();
      this.view._togglerModel.trigger('change:active');
      expect(this.view._onTogglerChanged).toHaveBeenCalled();
    });

    it('should call handleRoute if routeModel:currentRoute changes', function () {
      Router.getRouteModel().trigger('change:currentRoute');
      expect(this.view.handleRoute).toHaveBeenCalled();
    });

    it('should call render if analysisDefinitionNodeModel:error changes', function () {
      spyOn(this.view, 'render');
      this.view._initBinds();
      this.analysisDefinitionNodeModel.trigger('change:error');
      expect(this.view.render).toHaveBeenCalled();
    });
  });

  describe('._onTogglerChanged', function () {
    it('should set context correctly', function () {
      expect(this.view.model.get('context')).toEqual('map');
      this.view._togglerModel.set('active', true, { silent: true });
      this.view._onTogglerChanged();
      expect(this.view.model.get('context')).toEqual('table');

      this.view._togglerModel.set('active', false, { silent: true });
      this.view._onTogglerChanged();
      expect(this.view.model.get('context')).toEqual('map');
    });

    it('should call _initTable if context is table', function () {
      spyOn(this.view, '_initTable');
      this.view._togglerModel.set('active', true, { silent: true });
      this.view._onTogglerChanged();
      expect(this.view._initTable).toHaveBeenCalled();
    });

    it('should call _destroyTable if context is map', function () {
      spyOn(this.view, '_destroyTable');
      this.view._togglerModel.set('active', false, { silent: true });
      this.view._onTogglerChanged();
      expect(this.view._destroyTable).toHaveBeenCalled();
    });
  });

  describe('._isContextTable', function () {
    it('should return true if model context is table', function () {
      expect(this.view._isContextTable()).toBe(false);
      this.view.model.set('context', 'table', { silent: true });
      expect(this.view._isContextTable()).toBe(true);
    });
  });

  afterEach(function () {
    dashboardCanvasEl.parentNode.removeChild(dashboardCanvasEl);
    this.view.clean();
  });
});
