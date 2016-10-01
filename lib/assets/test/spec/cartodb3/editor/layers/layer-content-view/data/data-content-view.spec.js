var Backbone = require('backbone');
var _ = require('underscore');
var ConfigModel = require('../../../../../../../javascripts/cartodb3/data/config-model');
var DataContentView = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/data/data-content-view');
var DataColumnsModel = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/data/data-columns-model');
var TableStats = require('../../../../../../../javascripts/cartodb3/components/modals/add-widgets/tablestats');
var QuerySchemaModel = require('../../../../../../../javascripts/cartodb3/data/query-schema-model');
var QueryGeometryModel = require('../../../../../../../javascripts/cartodb3/data/query-geometry-model');

describe('editor/layers/layers-content-view/data/data-content-view', function () {
  var view;
  var layerDefinitionModel;
  var querySchemaModel;
  var queryGeometryModel;

  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe',
      user_name: 'cdb',
      api_key: 'foo'
    });

    var ts = new TableStats({
      configModel: configModel
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

    spyOn(DataContentView.prototype, '_handleWidget').and.callThrough();
    spyOn(DataContentView.prototype, '_renderStats');
    spyOn(DataContentView.prototype, '_checkGeometry').and.callThrough();
    spyOn(DataContentView.prototype, '_normalizeTimeSeriesColumn').and.callThrough();
    spyOn(DataContentView.prototype, '_columnsReady').and.returnValue(false);

    var userActions = {
      saveWidgetOption: function () {
        return {id: 'w1'};
      }
    };

    view = new DataContentView({
      widgetDefinitionsCollection: widgetDefinitionsCollection,
      stackLayoutModel: stackLayoutModel,
      userActions: userActions,
      querySchemaModel: querySchemaModel,
      queryGeometryModel: queryGeometryModel,
      columnsNumberModel: columnModel,
      columnsModel: columnsModel,
      infoboxModel: new Backbone.Model()
    });

    view._columnsCollection.add(m0);
    view._columnsCollection.add(m1);
    view._columnsCollection.add(m2);

    view.render();
  });

  it('should render "placeholder" if loading', function () {
    view.modelView.set({state: 'loading'});
    expect(view.$('.FormPlaceholder-paragraph').length).toBe(4);
    expect(_.keys(view._subviews).length).toBe(0);
  });

  it('should render no geometry view if no data', function () {
    spyOn(view._queryGeometryModel, 'hasValue').and.returnValue(false);
    // To force a change event
    view._queryGeometryModel.set({status: 'unfetched'}, {silent: true});
    view._queryGeometryModel.set({status: 'fetched'});

    expect(DataContentView.prototype._checkGeometry).toHaveBeenCalled();
    expect(view.modelView.get('state')).toBe('no-geometry');
    expect(view.$el.text()).toContain('editor.data.no-geometry-data');
    expect(_.keys(view._subviews).length).toBe(0);
  });

  it('should bind events properly', function () {
    view._columnsModel.set({render: true});
    expect(view._renderStats).toHaveBeenCalled();
    view._columnsCollection.at(0).set({selected: true});
    expect(view._handleWidget).toHaveBeenCalled();
  });

  it('should manage time-series properly', function () {
    view._columnsModel.set({render: true});
    expect(view._renderStats).toHaveBeenCalled();
    view._columnsCollection.at(1).set({selected: true});
    expect(view._handleWidget).toHaveBeenCalled();

    view._columnsCollection.at(2).set({selected: true});
    expect(view._columnsCollection.at(2).get('widget')).toBeTruthy();
    expect(view._normalizeTimeSeriesColumn).toHaveBeenCalled();
    expect(view._columnsCollection.at(1).get('selected')).toBe(false);
    expect(view._columnsCollection.at(1).get('widget')).toBeFalsy();
  });

  it('should not have any leaks', function () {
    expect(view).toHaveNoLeaks();
  });
});
