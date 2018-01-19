var Backbone = require('backbone');
var ConfigModel = require('../../../../../../../javascripts/cartodb3/data/config-model');
var LayerContentModel = require('../../../../../../../javascripts/cartodb3/data/layer-content-model');
var DataContentView = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/data/data-content-view');
var DataColumnsModel = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/data/data-columns-model');
var TableStats = require('../../../../../../../javascripts/cartodb3/components/modals/add-widgets/tablestats');
var QuerySchemaModel = require('../../../../../../../javascripts/cartodb3/data/query-schema-model');
var QueryGeometryModel = require('../../../../../../../javascripts/cartodb3/data/query-geometry-model');
var dataNoGeometryTemplate = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/data/data-content-nogeometry.tpl');

describe('editor/layers/layers-content-view/data/data-content-view', function () {
  var view;
  var layerDefinitionModel;
  var querySchemaModel;
  var queryGeometryModel;
  var toggleOverlaySpy;
  var handleWidgetSpy;
  var normalizeTSColumnSpy;
  var renderSpy;
  var isErroredSpy;

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
    queryGeometryModel.hasValue = function () {
      return true;
    };

    var analysisDefinitionNodeModel = new Backbone.Model();
    analysisDefinitionNodeModel.querySchemaModel = querySchemaModel;
    analysisDefinitionNodeModel.queryGeometryModel = queryGeometryModel;

    layerDefinitionModel = new Backbone.Model();
    layerDefinitionModel.getAnalysisDefinitionNodeModel = function () {
      return analysisDefinitionNodeModel;
    };

    var widgetDefinitionsCollection = new Backbone.Collection([
      {
        type: 'category',
        source: 'a0',
        column: 'city'
      }
    ]);

    var columnModel = new Backbone.Model({
      columns: 3
    });

    var stackLayoutModel = jasmine.createSpyObj('stackLayoutModel', ['goToStep']);

    var columnsModel = new DataColumnsModel({}, {
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
    spyOn(DataContentView.prototype, '_handleStats');
    spyOn(DataContentView.prototype, '_renderStats');
    spyOn(DataContentView.prototype, '_showError');

    var userActions = {
      saveWidgetOption: function () {
        return {id: 'w1'};
      }
    };

    this.layerContentModel = new LayerContentModel({}, {
      querySchemaModel: new Backbone.Model(),
      queryGeometryModel: new Backbone.Model(),
      queryRowsCollection: new Backbone.Collection()
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
      layerContentModel: this.layerContentModel
    });

    view._columnsCollection.add(m0);
    view._columnsCollection.add(m1);
    view._columnsCollection.add(m2);

    return view;
  };

  beforeEach(function () {
    renderSpy = spyOn(DataContentView.prototype, 'render');
    normalizeTSColumnSpy = spyOn(DataContentView.prototype, '_normalizeTimeSeriesColumn');
    handleWidgetSpy = spyOn(DataContentView.prototype, '_handleWidget');
    toggleOverlaySpy = spyOn(DataContentView.prototype, '_toggleOverlay');
    isErroredSpy = spyOn(DataContentView.prototype, '_isErrored');

    view = createViewFn();
  });

  describe('.render', function () {
    it('should render properly', function () {
      renderSpy.and.callThrough();

      view.render();

      expect(view._renderStats).toHaveBeenCalled();
      expect(view._toggleOverlay).toHaveBeenCalled();
    });

    it('should not have any leaks', function () {
      renderSpy.and.callThrough();

      view.render();

      expect(view).toHaveNoLeaks();
    });
  });

  describe('when layer content model has errors', function () {
    describe('.render', function () {
      it('should render properly', function () {
        renderSpy.and.callThrough();
        isErroredSpy.and.returnValue(true);

        view.render();

        expect(view._showError).toHaveBeenCalled();
        expect(view._toggleOverlay).toHaveBeenCalled();
      });
    });
  });

  describe('when query geometry model has no value', function () {
    describe('.render', function () {
      it('should render properly', function () {
        renderSpy.and.callThrough();
        spyOn(view._queryGeometryModel, 'hasValue').and.returnValue(false);

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

  describe('._initBinds', function () {
    it('should call .render when layerContentModel:state changes', function () {
      view._layerContentModel.set({ state: 'fetched' });

      expect(view.render).toHaveBeenCalled();
    });

    it('should call .render when queryGeometryModel:simple_geom changes', function () {
      view._queryGeometryModel.set({ simple_geom: 'polygon' });

      expect(view.render).toHaveBeenCalled();
    });

    it('should call .render when _columnsModel:render changes', function () {
      view._columnsModel.set({ render: true });

      expect(view._handleStats).toHaveBeenCalled();
    });

    it('should call .render when _columnsCollection:selected changes', function () {
      view._columnsCollection.at(0).set({ selected: true });

      expect(view._handleWidget).toHaveBeenCalled();
    });

    it('should call .render when _overlayModel:visible changes', function () {
      view._overlayModel.set({ visible: true });

      expect(view._toggleOverlay).toHaveBeenCalled();
    });
  });

  describe('._isErrored', function () {
    it('should return layerContentModel isErrored', function () {
      isErroredSpy.and.callThrough();
      spyOn(view._layerContentModel, 'isErrored').and.returnValues(false, true);

      expect(view._isErrored()).toBe(false);
      expect(view._isErrored()).toBe(true);
    });
  });

  describe('._columnsReady', function () {
    it('should return true if _columnsModel:render is true', function () {
      view._columnsModel.set({ render: false }, { silent: true });
      expect(view._columnsReady()).toBe(false);

      view._columnsModel.set({ render: true }, { silent: true });
      expect(view._columnsReady()).toBe(true);
    });
  });

  describe('._toggleOverlay', function () {
    it('should toggle overlay', function () {
      toggleOverlaySpy.and.callThrough();
      expect(view.$el.hasClass('is-disabled')).toBe(false);

      view._overlayModel.set('visible', true, { silent: true });
      view._toggleOverlay();

      expect(view.$el.hasClass('is-disabled')).toBe(true);
    });
  });

  it('should render the "apply" button properly in advanced mode', function () {
    view.$('.Options-bar .CDB-Toggle.js-input').click();
    expect(view.$('.js-apply').hasClass('.CDB-Size-small')).toBeFalsy();
  });

  it('should manage time-series properly', function () {
    renderSpy.and.callThrough();
    handleWidgetSpy.and.callThrough();
    normalizeTSColumnSpy.and.callThrough();

    view.render();

    view._columnsModel.set({ render: true });
    expect(view._renderStats).toHaveBeenCalled();

    view._columnsCollection.at(1).set({ selected: true });
    expect(view._handleWidget).toHaveBeenCalled();

    view._columnsCollection.at(2).set({ selected: true });
    expect(view._columnsCollection.at(2).get('widget')).toBeTruthy();
    expect(view._normalizeTimeSeriesColumn).toHaveBeenCalled();
    expect(view._columnsCollection.at(1).get('selected')).toBe(false);
    expect(view._columnsCollection.at(1).get('widget')).toBeFalsy();
  });
});
