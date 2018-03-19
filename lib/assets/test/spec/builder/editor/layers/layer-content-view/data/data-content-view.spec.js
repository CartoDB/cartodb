var Backbone = require('backbone');
var ConfigModel = require('builder/data/config-model');
var LayerContentModel = require('builder/data/layer-content-model');
var DataContentView = require('builder/editor/layers/layer-content-views/data/data-content-view');
var DataColumnsModel = require('builder/editor/layers/layer-content-views/data/data-columns-model');
var TableStats = require('builder/components/modals/add-widgets/tablestats');
var QuerySchemaModel = require('builder/data/query-schema-model');
var QueryGeometryModel = require('builder/data/query-geometry-model');
var dataNoGeometryTemplate = require('builder/editor/layers/layer-content-views/data/data-content-nogeometry.tpl');

describe('editor/layers/layers-content-view/data/data-content-view', function () {
  var view;
  var layerDefinitionModel;
  var layerContentModel;
  var querySchemaModel;
  var queryGeometryModel;
  var columnsModel;
  var widgetDefinitionsCollection;

  var createViewFn = function (options) {
    var configModel = new ConfigModel({
      base_url: '/u/pepe',
      user_name: 'cdb',
      api_key: 'foo'
    });

    var ts = new TableStats({
      configModel: configModel
    });

    var overlayModel = new Backbone.Model({
      visible: false
    });

    querySchemaModel = new QuerySchemaModel({
      query: 'SELECT * FROM table',
      status: 'fetched'
    }, {
      configModel: {}
    });

    queryGeometryModel = new QueryGeometryModel({
      query: 'SELECT * FROM table',
      simple_geom: 'point',
      status: 'fetched'
    }, {
      configModel: {}
    });

    var analysisDefinitionNodeModel = new Backbone.Model({});
    analysisDefinitionNodeModel.querySchemaModel = querySchemaModel;
    analysisDefinitionNodeModel.queryGeometryModel = queryGeometryModel;

    layerDefinitionModel = new Backbone.Model({});

    layerDefinitionModel.getAnalysisDefinitionNodeModel = function () {
      return analysisDefinitionNodeModel;
    };

    layerDefinitionModel.isDataFiltered = function () {};
    layerDefinitionModel.canBeGeoreferenced = function () {};

    widgetDefinitionsCollection = new Backbone.Collection([{
      type: 'category',
      source: 'a0',
      column: 'city',
      analysisDefinitionNodeModel: function () {
        return new Backbone.Model({id: 'a0'});
      }
    }]);

    var columnModel = new Backbone.Model({
      columns: 3
    });

    var stackLayoutModel = jasmine.createSpyObj('stackLayoutModel', ['goToStep']);

    columnsModel = new DataColumnsModel({}, {
      layerDefinitionModel: layerDefinitionModel,
      widgetDefinitionsCollection: widgetDefinitionsCollection,
      tableStats: ts
    });

    var m0 = new Backbone.Model({
      cid: 1,
      type: 'histogram',
      selected: false
    });

    m0.analysisDefinitionNodeModel = function () { return {id: 'a1'}; };

    var m1 = new Backbone.Model({
      cid: 2,
      type: 'time-series',
      selected: false
    });

    m1.analysisDefinitionNodeModel = function () { return {id: 'a2'}; };

    var m2 = new Backbone.Model({
      cid: 3,
      type: 'time-series',
      selected: false
    });

    m2.analysisDefinitionNodeModel = function () { return {id: 'a3'}; };

    spyOn(columnsModel, 'getCollection').and.returnValue(new Backbone.Collection());

    var userActions = {
      saveWidgetOption: function () {
        return Promise.resolve({id: 'w1'});
      },
      updateWidgetsOrder: function () {
        return Promise.resolve({});
      }
    };

    var queryRowsCollection = new Backbone.Collection();
    queryRowsCollection.hasRepeatedErrors = function () { return false; };

    layerContentModel = new LayerContentModel({}, {
      querySchemaModel: querySchemaModel,
      queryGeometryModel: queryGeometryModel,
      queryRowsCollection: queryRowsCollection
    });

    view = new DataContentView({
      widgetDefinitionsCollection: widgetDefinitionsCollection,
      stackLayoutModel: stackLayoutModel,
      userActions: userActions,
      querySchemaModel: querySchemaModel,
      queryGeometryModel: queryGeometryModel,
      columnsNumberModel: columnModel,
      columnsModel: columnsModel,
      infoboxModel: new Backbone.Model(),
      overlayModel: overlayModel,
      layerContentModel: layerContentModel,
      layerDefinitionModel: layerDefinitionModel
    });

    view._columnsCollection.add(m0);
    view._columnsCollection.add(m1);
    view._columnsCollection.add(m2);

    spyOn(queryGeometryModel, 'hasValueAsync').and.returnValue(Promise.resolve(true));
    spyOn(layerDefinitionModel, 'isDataFiltered').and.returnValue(Promise.resolve(true));
    spyOn(layerDefinitionModel, 'canBeGeoreferenced').and.returnValue(Promise.resolve(true));

    return view;
  };

  describe('initialize', function () {
    beforeEach(function () {
      spyOn(DataContentView.prototype, '_initViewState');
      view = createViewFn();
    });

    it('should initialize properly', function () {
      expect(DataContentView.prototype._initViewState).toHaveBeenCalled();
    });
  });

  describe('.render', function () {
    beforeEach(function () {
      view = createViewFn();
      spyOn(view, '_renderStats');
      spyOn(view, '_toggleOverlay');

      view.render();
    });

    it('should render properly', function () {
      expect(view._renderStats).toHaveBeenCalled();
      expect(view._toggleOverlay).toHaveBeenCalled();
    });

    it('should render the "apply" button properly in advanced mode', function () {
      view.$('.Options-bar .CDB-Toggle.js-input').click();
      expect(view.$('.js-apply').hasClass('.CDB-Size-small')).toBeFalsy();
    });

    it('should not have any leaks', function () {
      expect(view).toHaveNoLeaks();
    });
  });

  describe('when layer content model has errors', function () {
    describe('.render', function () {
      beforeEach(function () {
        view = createViewFn();
        spyOn(view, '_isErrored').and.returnValue(true);
        spyOn(view, '_showError');
        spyOn(view, '_toggleOverlay');
      });

      it('should render properly', function () {
        view.render();

        expect(view._showError).toHaveBeenCalled();
        expect(view._toggleOverlay).toHaveBeenCalled();
      });
    });
  });

  describe('when data is filtered', function () {
    describe('.render', function () {
      beforeEach(function () {
        view = createViewFn();
      });

      it('should render properly', function () {
        view._viewState.set('isDataFiltered', true);

        view.render();

        expect(view.el.innerHTML).toContain(
          dataNoGeometryTemplate({
            message: 'editor.layers.warnings.no-data.message',
            action: 'editor.layers.warnings.no-data.action-message'
          })
        );
      });
    });
  });

  describe('when query geometry model has no value', function () {
    describe('.render', function () {
      beforeEach(function () {
        view = createViewFn();
      });

      it('should render properly', function () {
        view._viewState.set('hasGeom', false);

        view.render();

        expect(view.el.innerHTML).toContain(
          dataNoGeometryTemplate({
            message: 'editor.data.no-geometry-data.message',
            action: 'editor.data.no-geometry-data.action-message'
          })
        );
      });
    });
  });

  describe('._initModels', function () {
    beforeEach(function () {
      view = createViewFn();
    });

    it('should create _columnsCollection', function () {
      view._columnsCollection = undefined;
      expect(view._columnsCollection).not.toBeDefined();

      view._initModels();
      expect(view._columnsCollection).toBeDefined();
    });

    it('should create model', function () {
      view.model = undefined;
      expect(view.model).not.toBeDefined();

      view._initModels();
      expect(view.model).toBeDefined();
    });
  });

  describe('._initViewState', function () {
    beforeEach(function () {
      view = createViewFn();
    });

    it('should initialize _viewState model properly', function () {
      spyOn(view, '_setViewState');
      view._initViewState();

      expect(view._viewState.get('hasGeom')).toEqual(true);
      expect(view._viewState.get('isDataFiltered')).toEqual(false);
      expect(view._viewState.get('canBeGeoreferenced')).toEqual(false);

      expect(view._setViewState).toHaveBeenCalled();
    });
  });

  describe('._initBinds', function () {
    it('should call _setViewState when layerContentModel:state changes', function () {
      spyOn(DataContentView.prototype, '_setViewState');
      view = createViewFn();
      layerContentModel.set({ state: 'fetched' });

      expect(DataContentView.prototype._setViewState).toHaveBeenCalled();
    });

    it('should call ._handleStats when _columnsModel:render changes', function () {
      spyOn(DataContentView.prototype, '_handleStats');
      view = createViewFn();
      view._columnsModel.set({ render: true });

      expect(DataContentView.prototype._handleStats).toHaveBeenCalled();
    });

    it('should call ._handleWidget when _columnsCollection:selected changes', function () {
      spyOn(DataContentView.prototype, '_handleWidget');
      view = createViewFn();
      view._columnsCollection.at(0).set({ selected: true });

      expect(DataContentView.prototype._handleWidget).toHaveBeenCalled();
    });

    it('should call .render when _overlayModel:visible changes', function () {
      spyOn(DataContentView.prototype, '_toggleOverlay');
      view = createViewFn();
      view._overlayModel.set({ visible: true });

      expect(DataContentView.prototype._toggleOverlay).toHaveBeenCalled();
    });

    it('should call render when _viewState changes', function () {
      spyOn(DataContentView.prototype, 'render');
      view = createViewFn();
      view._viewState.set({ isDataFiltered: true });

      expect(DataContentView.prototype.render).toHaveBeenCalled();
    });
  });

  describe('._isErrored', function () {
    it('should return layerContentModel isErrored', function () {
      spyOn(view._layerContentModel, 'isErrored').and.returnValues(false, true);

      expect(view._isErrored()).toBe(false);
      expect(view._isErrored()).toBe(true);
    });
  });

  describe('._columnsReady', function () {
    beforeEach(function () {
      view = createViewFn();
    });

    it('should return true if _columnsModel:render is true', function () {
      view._columnsModel.set({ render: false }, { silent: true });
      expect(view._columnsReady()).toBe(false);

      view._columnsModel.set({ render: true }, { silent: true });
      expect(view._columnsReady()).toBe(true);
    });
  });

  describe('._toggleOverlay', function () {
    beforeEach(function () {
      view = createViewFn();
    });

    it('should toggle overlay', function () {
      expect(view.$el.hasClass('is-disabled')).toBe(false);

      view._overlayModel.set('visible', true, { silent: true });
      view._toggleOverlay();

      expect(view.$el.hasClass('is-disabled')).toBe(true);
    });
  });

  describe('._handleWidget', function () {
    beforeEach(function () {
      view = createViewFn();

      spyOn(view._userActions, 'saveWidgetOption')
        .and.returnValue(Promise.resolve(view._columnsCollection.at(1)));
    });

    it('should call add a new widget if the model is selected', function (done) {
      spyOn(view, '_addWidget');

      view.render();

      view._columnsCollection.at(1).set({ selected: true });
      view._handleWidget(view._columnsCollection.at(1));

      setTimeout(function () {
        expect(view._addWidget).toHaveBeenCalledWith(view._columnsCollection.at(1));
        done();
      }, 0);
    });

    it('should destroy the widget if the model is selected', function (done) {
      spyOn(view, '_destroyWidget');

      view.render();

      view._handleWidget(view._columnsCollection.at(1));

      setTimeout(function () {
        expect(view._destroyWidget).toHaveBeenCalledWith(view._columnsCollection.at(1));
        done();
      }, 0);
    });
  });

  describe('._addWidget', function () {
    beforeEach(function () {
      view = createViewFn();

      spyOn(view._userActions, 'saveWidgetOption')
        .and
        .returnValue(Promise.resolve(view._columnsCollection.at(0)));
    });

    it('should set the widget if the model exists', function (done) {
      var existingModel = widgetDefinitionsCollection.at(0);
      var model = view._columnsCollection.at(0);

      spyOn(view._columnsModel, 'findWidget').and.returnValue(existingModel);
      spyOn(model, 'set').and.callThrough();

      view.render();

      view._addWidget(model);

      setTimeout(function () {
        expect(model.set).toHaveBeenCalled();
        expect(model.get('widget')).toEqual(existingModel);
        done();
      }, 0);
    });

    it('should call saveWidget if the model does not exist', function (done) {
      var newModel = new Backbone.Model();
      spyOn(view, '_saveWidget');
      view.render();
      view._columnsModel.set({ render: true });

      view._saveWidget(newModel);

      setTimeout(function () {
        expect(view._saveWidget).toHaveBeenCalledWith(newModel);
        done();
      }, 0);
    });
  });

  describe('._saveWidget', function () {
    var newModel;

    beforeEach(function () {
      view = createViewFn();
      newModel = new Backbone.Model({});
    });

    it('should call saveWidgetOption', function (done) {
      spyOn(view._userActions, 'saveWidgetOption')
        .and
        .returnValue(Promise.resolve(view._columnsCollection.at(0)));

      spyOn(newModel, 'set');

      view.render();
      view._saveWidget(newModel);

      setTimeout(function () {
        expect(view._userActions.saveWidgetOption).toHaveBeenCalledWith(newModel);
        expect(newModel.set).toHaveBeenCalled();
        done();
      }, 0);
    });

    it('should call updateWidgetsOrder if the new widget model is created', function (done) {
      var newModel = new Backbone.Model({});
      spyOn(view._userActions, 'saveWidgetOption')
        .and
        .returnValue(Promise.resolve(newModel));

      spyOn(view._userActions, 'updateWidgetsOrder');

      view.render();
      view._saveWidget(newModel);

      setTimeout(function () {
        expect(view._userActions.updateWidgetsOrder).toHaveBeenCalled();
        done();
      }, 0);
    });

    it('should render again if both the creation and the update work', function (done) {
      spyOn(view._userActions, 'saveWidgetOption')
        .and
        .returnValue(Promise.resolve(newModel));

      spyOn(view._userActions, 'updateWidgetsOrder')
        .and
        .returnValue(Promise.resolve({}));

      spyOn(view, 'render');
      view.render();
      view._saveWidget(newModel);

      setTimeout(function () {
        expect(view.render).toHaveBeenCalledTimes(2);
        done();
      }, 0);
    });

    it('should manage time-series properly', function (done) {
      spyOn(view._userActions, 'saveWidgetOption')
        .and
        .returnValue(Promise.resolve(view._columnsCollection.at(2)));

      view.render();

      spyOn(view, '_renderStats').and.callThrough();
      spyOn(view, '_normalizeTimeSeriesColumn').and.callThrough();

      view._columnsModel.set({ render: true });
      view._columnsCollection.at(2).set({ selected: true });

      setTimeout(function () {
        expect(view._renderStats).toHaveBeenCalled();
        expect(view._normalizeTimeSeriesColumn).toHaveBeenCalled();
        expect(view._columnsCollection.at(1).get('selected')).toBe(false);
        expect(view._columnsCollection.at(1).get('widget')).toBeFalsy();
        expect(view._columnsCollection.at(2).get('widget')).toBeTruthy();
        done();
      }, 0);
    });
  });

  describe('._destroyWidget', function () {
    beforeEach(function () {
      view = createViewFn();
    });

    it('should call the destroy function if the model exists', function () {
      var widgetModel = widgetDefinitionsCollection.at(0);
      var model = new Backbone.Model({
        widget: widgetModel
      });

      spyOn(widgetModel, 'destroy');

      view.render();
      view._destroyWidget(model);
      expect(widgetModel.destroy).toHaveBeenCalled();
    });
  });

  describe('._setViewState', function () {
    beforeEach(function () {
      view = createViewFn();
      view._viewState.set({
        hasGeom: false,
        canBeGeoreferenced: false,
        isDataFiltered: false
      });
    });

    it('should be able to update the view state of hasGeom', function (done) {
      setTimeout(function () {
        expect(view._viewState.get('hasGeom')).toEqual(true);
        done();
      }, 0);
    });
  });
});
