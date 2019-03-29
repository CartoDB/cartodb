var _ = require('underscore');
var $ = require('jquery');
var Backbone = require('backbone');
var AnalysisDefinitionNodeSourceModel = require('builder/data/analysis-definition-node-source-model');
var AnalysisFormsCollection = require('builder/editor/layers/layer-content-views/analyses/analysis-forms-collection');
var LayerDefinitionsCollection = require('builder/data/layer-definitions-collection');
var LayerDefinitionModel = require('builder/data/layer-definition-model');
var LayerContentView = require('builder/editor/layers/layer-content-view');
var ConfigModel = require('builder/data/config-model');
var UserModel = require('builder/data/user-model');
var EditorModel = require('builder/data/editor-model');
var UserNotifications = require('builder/data/user-notifications');
var AnalysesService = require('builder/editor/layers/layer-content-views/analyses/analyses-service');
var FactoryModals = require('../../factories/modals');
var Router = require('builder/routes/router');

describe('editor/layers/layer-content-view/layer-content-view', function () {
  var view;
  var analysisDefinitionNodeModel;
  var editorModel;
  var layerDefinitionModel;
  var dashboardCanvasEl;
  var handleRouteSpy;
  var analysesTabName = 'analyses';
  var dataTabName = 'data';

  var createViewFn = function (options) {
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

    var userModel = new UserModel({}, {
      configModel: configModel,
      username: 'pepe'
    });

    var mapDefModel = new Backbone.Model({
      legends: true
    });

    layerDefinitionModel = new LayerDefinitionModel({
      id: 'l-1',
      kind: 'carto',
      options: {
        source: 'a0',
        letter: 'a',
        table_name: 'foo'
      }
    }, {
      parse: true,
      configModel: configModel
    });

    var onboardings = new Backbone.Model();
    onboardings.create = function () {};
    onboardings.destroy = function () {};

    analysisDefinitionNodeModel = new AnalysisDefinitionNodeSourceModel({
      id: 'a1',
      type: 'source',
      table_name: 'foo'
    }, {
      configModel: configModel,
      userModel: userModel,
      collection: new Backbone.Collection()
    });

    analysisDefinitionNodeModel.querySchemaModel.attributes.query = 'SELECT * FROM foo';

    var layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
      configModel: configModel,
      userModel: userModel,
      analysisDefinitionNodesCollection: new Backbone.Collection(),
      mapId: 'map-123',
      stateDefinitionModel: {}
    });

    layerDefinitionsCollection.add(layerDefinitionModel);

    var widgetDefinitionsCollection = new Backbone.Collection();

    widgetDefinitionsCollection.isThereTimeSeries = function () {
      return false;
    };

    widgetDefinitionsCollection.isThereOtherWidgets = function () {
      return false;
    };

    spyOn(layerDefinitionModel, 'getAnalysisDefinitionNodeModel').and.returnValue(analysisDefinitionNodeModel);
    spyOn(layerDefinitionModel, 'findAnalysisDefinitionNodeModel').and.returnValue(analysisDefinitionNodeModel);
    spyOn(Router, 'goToLayerList');
    spyOn(Router, 'navigate');

    handleRouteSpy = spyOn(LayerContentView.prototype, '_handleRoute');

    var onboardingNotification = new UserNotifications({}, {
      key: 'builder',
      configModel: configModel
    });

    var visDefinitionModel = new Backbone.Model();
    var stackLayoutModel = jasmine.createSpyObj('stackLayoutModel', ['prevStep', 'goToStep']);

    AnalysesService.init({
      onboardings: onboardings,
      layerDefinitionsCollection: layerDefinitionsCollection,
      modals: FactoryModals.createModalService(),
      userModel: userModel,
      configModel: configModel
    });

    editorModel = new EditorModel({ edition: false });

    var viewOptions = {
      mapDefinitionModel: mapDefModel,
      layerDefinitionModel: layerDefinitionModel,
      analysisDefinitionsCollection: new Backbone.Collection(),
      analysisDefinitionNodesCollection: new Backbone.Collection(),
      layerDefinitionsCollection: layerDefinitionsCollection,
      legendDefinitionsCollection: new Backbone.Collection(),
      widgetDefinitionsCollection: widgetDefinitionsCollection,
      userModel: userModel,
      modals: FactoryModals.createModalService(),
      onboardings: onboardings,
      analysis: {},
      userActions: {},
      vis: {},
      stackLayoutModel: stackLayoutModel,
      configModel: configModel,
      editorModel: editorModel,
      mapModeModel: jasmine.createSpyObj('mapModeModel', ['enterDrawingFeatureMode']),
      stateDefinitionModel: {},
      onboardingNotification: onboardingNotification,
      visDefinitionModel: visDefinitionModel
    };

    return new LayerContentView(_.extend(viewOptions, options));
  };

  describe('.initialize', function () {
    beforeEach(function () {
      spyOn(LayerContentView.prototype, '_updateViewState').and.callThrough();
      spyOn(LayerContentView.prototype, '_initViewState').and.callThrough();
      spyOn(LayerContentView.prototype, '_initBinds').and.callThrough();
      spyOn(AnalysesService, 'setLayerId').and.callThrough();

      view = createViewFn();
    });

    it('should initialize correctly', function () {
      expect(view.model._querySchemaModel).toBeDefined();
      expect(view.model._queryGeometryModel).toBeDefined();
      expect(view.model._queryRowsCollection).toBeDefined();

      expect(LayerContentView.prototype._updateViewState).toHaveBeenCalled();
      expect(LayerContentView.prototype._initViewState).toHaveBeenCalled();
      expect(LayerContentView.prototype._initBinds).toHaveBeenCalled();
      expect(AnalysesService.setLayerId).toHaveBeenCalled();
    });
  });

  describe('.render', function () {
    beforeEach(function () {
      view = createViewFn();
      spyOn(view, '_renderHeaderView').and.callThrough();
      spyOn(view, '_renderLayerTabPaneView').and.callThrough();
    });

    it('should render correctly', function () {
      view.render();

      expect(_.size(view._subviews)).toBe(3); // [Header, Geometry Toolips]
      expect(view.$('.Editor-HeaderInfo-titleText').text()).toContain('foo');
    });

    it('should have no leaks', function () {
      expect(view).toHaveNoLeaks();
    });

    describe('when all query objects are loaded', function () {
      beforeEach(function () {
        view.render();
      });

      it('should render correctly', function () {
        expect(_.size(view._subviews)).toBe(3); // [Header, TabPane, Geometry Toolips]
        expect(view.$('.Editor-HeaderInfo-titleText').text()).toContain('foo');
        expect(view.$('.CDB-NavMenu .CDB-NavMenu-item').length).toBe(5);
        expect(view.$('.js-editorPanelContent').length).toBe(1); // Onboarding
      });
    });

    describe('when can be georeferenced', function () {
      beforeEach(function () {
        view._viewState.set('canBeGeoreferenced', true);
        view.render();
      });

      it('should disable tabs', function () {
        expect(view.$el.find('.CDB-NavMenu-item.is-disabled').length).toBe(3);
      });

      it('should select the analysis tab', function () {
        expect(view._layerTabPaneView.getSelectedTabPaneName()).toBe(analysesTabName);
      });
    });

    describe('when analysisDefinitionNodeModel has errors', function () {
      beforeEach(function () {
        spyOn(analysisDefinitionNodeModel, 'hasFailed').and.returnValue(true);

        view.render();
      });

      it('should disable tabs properly', function () {
        expect(view.$el.find('.CDB-NavMenu-item.is-disabled').length).toBe(3);
      });

      it('should select the analysis tab', function () {
        expect(view._layerTabPaneView.getSelectedTabPaneName()).toBe(analysesTabName);
      });
    });

    describe('when is empty', function () {
      beforeEach(function () {
        spyOn(analysisDefinitionNodeModel.querySchemaModel, 'isDone').and.returnValue(true);
        spyOn(analysisDefinitionNodeModel.queryGeometryModel, 'isDone').and.returnValue(true);
        spyOn(analysisDefinitionNodeModel.queryRowsCollection, 'isDone').and.returnValue(true);
        spyOn(analysisDefinitionNodeModel, 'hasFailed').and.returnValue(false);

        view._viewState.set({
          isLayerEmpty: true
        });

        view.render();
      });

      it('should select the data tab', function () {
        expect(view._layerTabPaneView.getSelectedTabPaneName()).toBe(dataTabName);
      });
    });
  });

  describe('._initViewState', function () {
    beforeEach(function () {
      view = createViewFn();
    });

    it('should initialize viewState', function () {
      view._initViewState();

      expect(view._viewState).toBeDefined();
      expect(view._viewState.get('isLayerEmpty')).toEqual(false);
      expect(view._viewState.get('canBeGeoreferenced')).toEqual(false);
      expect(view._viewState.get('isLayerDone')).toEqual(false);
    });

    it('should call setViewState', function () {
      spyOn(view, '_setViewState');

      view._initViewState();

      expect(view._setViewState).toHaveBeenCalled();
    });
  });

  describe('._updateViewState', function () {
    beforeEach(function () {
      view = createViewFn();
      spyOn(view, '_fetchAllQueryObjects').and.returnValue(Promise.resolve(true));
      spyOn(view, '_setViewState').and.callThrough();
    });

    it('should call _setViewState if isDone', function () {
      spyOn(view.model, 'isDone').and.returnValue(true);

      view._updateViewState();

      expect(view._setViewState).toHaveBeenCalled();
    });

    it('should call _setViewState after all queries have been fetched', function (done) {
      spyOn(view.model, 'isDone').and.returnValue(false);

      view._updateViewState();

      setTimeout(function () {
        expect(view._setViewState).toHaveBeenCalled();
        done();
      }, 0);
    });
  });

  describe('._setViewState', function () {
    beforeEach(function () {
      view = createViewFn();
    });

    describe('set isLayerEmpty', function () {
      it('should be setted to true if layer is empty', function (done) {
        view.render();

        spyOn(view, 'render');
        spyOn(view._layerDefinitionModel, 'isEmptyAsync').and.returnValue(Promise.resolve(true));
        spyOn(view._layerDefinitionModel, 'canBeGeoreferenced').and.returnValue(Promise.resolve(true));

        view._setViewState();

        setTimeout(function () {
          expect(view._viewState.get('isLayerEmpty')).toEqual(true);
          expect(view._viewState.get('canBeGeoreferenced')).toEqual(true);
          done();
        }, 0);
      });
    });

    describe('set canBeGeoreferenced', function () {
      it('should be setted to true if layer can not be georeferenced', function (done) {
        view._viewState.set({
          isLayerEmpty: true,
          canBeGeoreferenced: false
        });

        view.render();

        spyOn(view._layerDefinitionModel, 'isEmptyAsync').and.returnValue(Promise.resolve(true));
        spyOn(view._layerDefinitionModel, 'canBeGeoreferenced').and.returnValue(Promise.resolve(true));

        view._setViewState();

        setTimeout(function () {
          expect(view._viewState.get('canBeGeoreferenced')).toEqual(true);
          done();
        }, 0);
      });

      it('should be setted to false if layer can be georeferenced', function (done) {
        view._viewState.set({
          isLayerEmpty: true,
          canBeGeoreferenced: true
        });

        view.render();

        spyOn(view._layerDefinitionModel, 'isEmptyAsync').and.returnValue(Promise.resolve(true));
        spyOn(view._layerDefinitionModel, 'canBeGeoreferenced').and.returnValue(Promise.resolve(false));

        view._setViewState();

        setTimeout(function () {
          expect(view._viewState.get('canBeGeoreferenced')).toEqual(false);
          done();
        }, 0);
      });
    });

    describe('set isLayerDone', function () {
      // isLayerDone can be false when entering and the UI should respond to that
      it('should set isLayerDone when entering the function and again when the promise resolves', function (done) {
        view._viewState.set('isLayerDone', true, { silent: true });
        spyOn(view._layerDefinitionModel, 'isEmptyAsync').and.returnValue(Promise.resolve(true));
        spyOn(view._layerDefinitionModel, 'canBeGeoreferenced').and.returnValue(Promise.resolve(false));
        spyOn(view._layerDefinitionModel, 'isDone').and.returnValue(false);

        view._setViewState();

        expect(view._viewState.get('isLayerDone')).toBe(false);
        view._layerDefinitionModel.isDone.and.returnValue(true);
        setTimeout(function () {
          expect(view._viewState.get('isLayerDone')).toEqual(true);
          done();
        }, 0);
      });
    });
  });

  describe('._renderLayerTabPaneView', function () {
    it('should disable all tabs but data is layer is empty', function () {
      view = createViewFn();
      view._viewState.set({
        isLayerEmpty: true,
        isLayerDone: true
      }, { silent: true });

      view._renderLayerTabPaneView();

      var tabs = view.$('nav > ul > li');

      expect(tabs[0].classList.contains('is-disabled')).toBe(false);
      expect(tabs[1].classList.contains('is-disabled')).toBe(true);
      expect(tabs[2].classList.contains('is-disabled')).toBe(true);
      expect(tabs[3].classList.contains('is-disabled')).toBe(true);
      expect(tabs[4].classList.contains('is-disabled')).toBe(true);
    });

    it('should enable all tabs but data is layer is not empty', function () {
      view = createViewFn();
      view._viewState.set({
        isLayerEmpty: false,
        isLayerDone: true
      }, { silent: true });

      view._renderLayerTabPaneView();

      var tabs = view.$('nav > ul > li');

      expect(tabs[0].classList.contains('is-disabled')).toBe(false);
      expect(tabs[1].classList.contains('is-disabled')).toBe(false);
      expect(tabs[2].classList.contains('is-disabled')).toBe(false);
      expect(tabs[3].classList.contains('is-disabled')).toBe(false);
      expect(tabs[4].classList.contains('is-disabled')).toBe(false);
    });
  });

  describe('._onClickBack', function () {
    beforeEach(function () {
      view = createViewFn();
      view.render();
    });

    it('should call goToLayerList in Router', function () {
      view.$('.js-back').click();

      expect(Router.goToLayerList).toHaveBeenCalled();
    });

    it('should set editorModel edition to false', function () {
      editorModel.set('edition', true, { silent: true });

      view.$('.js-back').click();

      expect(editorModel.get('edition')).toBe(false);
    });
  });

  describe('.handleRoute', function () {
    beforeEach(function () {
      view = createViewFn();
      view.render();
    });

    it('should create editOverlay', function () {
      handleRouteSpy.and.callThrough();
      var routeModel = new Backbone.Model({
        currentRoute: ['add_feature_']
      });

      view._handleRoute(routeModel);

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
      view = createViewFn();
      view.render();

      analysisDefNodeModel = view._getAnalysisDefinitionNodeModel();
      layerDefinitionModel = view._layerDefinitionModel;
      queryGeometryModel = view._getQueryGeometryModel();

      spyOn(analysisDefNodeModel, 'isReadOnly');
      needsGeoSpy = spyOn(view._layerDefinitionModel, 'canBeGeoreferenced');
      isEmptySpy = spyOn(view._layerDefinitionModel, 'isEmptyAsync');

      view._renderContextButtons();
    });

    afterEach(function () {
      view._destroyContextButtons();
    });

    it('shouldn\'t disable tabs', function () {
      needsGeoSpy.and.returnValue(Promise.resolve(false));
      isEmptySpy.and.returnValue(Promise.resolve(false));

      view.render();

      expect(view.$el.find('.CDB-NavMenu-item.is-disabled').length).toBe(0);
    });

    it('should not create editOverlay tip view', function () {
      expect($(dashboardCanvasEl).find('js-editOverlay').length).toBe(0);
    });

    it('should navigate when click on new geometry', function () {
      queryGeometryModel.set('simple_geom', 'point');
      analysisDefNodeModel.isReadOnly.and.returnValue(false);
      layerDefinitionModel.set('visible', true);
      view._renderContextButtons();

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
      view.clearSubViews();
      analysisDefNodeModel.isReadOnly.and.returnValue(true);
      layerDefinitionModel.set('visible', false);
      expect(hasTipsy(view._subviews)).toBe(true);
    });

    it('should not add tipsy subview when not visible or read only', function () {
      view.clearSubViews();
      analysisDefNodeModel.isReadOnly.and.returnValue(false);
      layerDefinitionModel.set('visible', true);
      expect(hasTipsy(view._subviews)).toBe(false);
    });

    it('should display only one button per geometry', function () {
      queryGeometryModel.set('simple_geom', 'polygon');
      view._renderContextButtons();
      expect($(dashboardCanvasEl).find('.Editor-contextSwitcherItem.js-newGeometryItem').length).toBe(1);
    });

    it('should show the button for the simple_geom type', function () {
      queryGeometryModel.set('simple_geom', 'point');
      view._renderContextButtons();
      expect($(dashboardCanvasEl).find('.js-newGeometry[data-feature-type="point"]').length).toBe(1);

      queryGeometryModel.set('simple_geom', 'line');
      view._renderContextButtons();
      expect($(dashboardCanvasEl).find('.js-newGeometry[data-feature-type="line"]').length).toBe(1);

      queryGeometryModel.set('simple_geom', 'polygon');
      view._renderContextButtons();
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
      view = createViewFn();
      jasmine.Ajax.install();
    });

    afterEach(function () {
      jasmine.Ajax.uninstall();
    });

    it('should call _renderContextButtons and set default style properties if there is a change in simple_geom to a valid value', function () {
      var queryGeometryModel = view._getQueryGeometryModel();
      queryGeometryModel.set('status', 'unfetched');
      queryGeometryModel.set('simple_geom', 'point');
      queryGeometryModel.set('query', 'SELECT TOP 10 FROM fake_table;');
      spyOn(view, '_renderContextButtons');

      jasmine.Ajax.stubRequest(/sql/)
        .andReturn(buildResponse('polygon'));
      view._initBinds();

      queryGeometryModel.set('simple_geom', 'polygon');

      expect(view._renderContextButtons).toHaveBeenCalled();
    });

    it('should call _renderContextButtons and not set default style properties if there is a change in simple_geom to nothing', function () {
      var queryGeometryModel = view._getQueryGeometryModel();
      queryGeometryModel.set('status', 'unfetched');
      queryGeometryModel.set('simple_geom', 'point');
      queryGeometryModel.set('query', 'SELECT TOP 10 FROM fake_table;');
      spyOn(view, '_renderContextButtons');

      jasmine.Ajax.stubRequest(/sql/)
        .andReturn(buildResponse(''));
      view._initBinds();

      queryGeometryModel.set('simple_geom', '');

      expect(view._renderContextButtons).toHaveBeenCalled();
    });

    it('should call _onTogglerChanged if togglerModel:active changes', function () {
      spyOn(view, '_onTogglerChanged');
      view._initBinds();
      view._togglerModel.trigger('change:active');
      expect(view._onTogglerChanged).toHaveBeenCalled();
    });

    it('should call handleRoute if routeModel:currentRoute changes', function () {
      var routeModel = Router.getRouteModel();

      routeModel.trigger('change:currentRoute', routeModel);

      expect(view._handleRoute).toHaveBeenCalled();
    });

    it('should call render if analysisDefinitionNodeModel:error changes', function () {
      spyOn(view, 'render');
      view._initBinds();
      analysisDefinitionNodeModel.trigger('change:error');
      expect(view.render).toHaveBeenCalled();
    });

    it('should call _updateViewState on change model state', function () {
      spyOn(view, 'render');
      spyOn(view, '_updateViewState');

      view._initBinds();

      view.model.set('state', 'fake');
      expect(view._updateViewState).toHaveBeenCalled();
    });

    it('should call _updateViewState on change layerDefinitionModel source', function () {
      spyOn(view, 'render');
      spyOn(view, '_updateViewState');

      view._initBinds();

      view._layerDefinitionModel.set('source', 'fake');

      expect(view._updateViewState).toHaveBeenCalled();
    });
  }); // end of '._initBinds'

  describe('._onTogglerChanged', function () {
    beforeEach(function () {
      view = createViewFn();
      view.render();
    });

    it('should set context correctly', function () {
      expect(view.model.get('context')).toEqual('map');
      view._togglerModel.set('active', true, { silent: true });
      view._onTogglerChanged();
      expect(view.model.get('context')).toEqual('table');

      view._togglerModel.set('active', false, { silent: true });
      view._onTogglerChanged();
      expect(view.model.get('context')).toEqual('map');
    });

    it('should call _initTable if context is table', function () {
      spyOn(view, '_initTable');
      view._togglerModel.set('active', true, { silent: true });
      view._onTogglerChanged();
      expect(view._initTable).toHaveBeenCalled();
    });

    it('should call _destroyTable if context is map', function () {
      spyOn(view, '_destroyTable');
      view._togglerModel.set('active', false, { silent: true });
      view._onTogglerChanged();
      expect(view._destroyTable).toHaveBeenCalled();
    });
  });

  describe('._isContextTable', function () {
    beforeEach(function () {
      view = createViewFn();
      view.render();
    });

    it('should return true if model context is table', function () {
      expect(view._isContextTable()).toBe(false);
      view.model.set('context', 'table', { silent: true });
      expect(view._isContextTable()).toBe(true);
    });
  });

  describe('when rendering analysis tab', function () {
    var addBindingsAndRender = function () {
      spyOn(analysisDefinitionNodeModel.querySchemaModel, 'isDone').and.returnValue(true);
      spyOn(analysisDefinitionNodeModel.queryGeometryModel, 'isDone').and.returnValue(true);
      spyOn(analysisDefinitionNodeModel.queryRowsCollection, 'isDone').and.returnValue(true);

      view.render();
    };

    describe('when analysis payload is a string and its in the formsCollection', function () {
      it('should use the analysis payload as selectedNodeId', function () {
        var analysisPayload = 'a1';
        spyOn(AnalysisFormsCollection.prototype, 'get').and.returnValue(analysisPayload);
        view = createViewFn({
          selectedTabItem: 'analyses',
          analysisPayload: analysisPayload
        });

        addBindingsAndRender();

        var analysesContentView = _.find(view._layerTabPaneView._subviews, function (view) {
          return view.className === 'Editor-content';
        });

        expect(analysesContentView._selectedNodeId).toEqual(analysisPayload);
      });
    });

    describe('when analysis payload is an object', function () {
      it('should use the analysis payload id key as selectedNodeId', function () {
        var analysisPayload = {
          id: 'a2'
        };
        view = createViewFn({
          selectedTabItem: 'analyses',
          analysisPayload: analysisPayload
        });

        addBindingsAndRender();

        var analysesContentView = _.find(view._layerTabPaneView._subviews, function (view) {
          return view.className === 'Editor-content';
        });

        expect(analysesContentView._selectedNodeId).toEqual(analysisPayload.id);
      });
    });

    describe('when analysis payload is null', function () {
      describe('when last node exists', function () {
        it('should redirect to the last node id', function () {
          var lastAnalysisNode = new Backbone.Model({
            id: 'a1'
          });
          spyOn(AnalysisFormsCollection.prototype, 'at').and.returnValue(lastAnalysisNode);
          spyOn(Router, 'goToAnalysisNode');
          view = createViewFn({
            selectedTabItem: 'analyses',
            analysisPayload: null
          });

          addBindingsAndRender();

          expect(Router.goToAnalysisNode).toHaveBeenCalledWith(
            layerDefinitionModel.get('id'),
            lastAnalysisNode.get('id'),
            { trigger: false, replace: true }
          );
        });
      });

      describe('when there is no nodes left', function () {
        it('should redirect to the analysis tab', function () {
          spyOn(Router, 'goToAnalysisTab');
          view = createViewFn({
            selectedTabItem: 'analyses',
            analysisPayload: null
          });

          addBindingsAndRender();

          expect(Router.goToAnalysisTab).toHaveBeenCalledWith(
            layerDefinitionModel.get('id'),
            { trigger: false, replace: true }
          );
        });
      });
    });
  });

  afterEach(function () {
    dashboardCanvasEl.parentNode && dashboardCanvasEl.parentNode.removeChild(dashboardCanvasEl);
    view.clean();
  });
});
