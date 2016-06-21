var Backbone = require('backbone');
var _ = require('underscore');
var ConfigModel = require('../../../../../../../javascripts/cartodb3/data/config-model');
var DataContentView = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/data/data-content-view');
var QuerySchemaModel = require('../../../../../../../javascripts/cartodb3/data/query-schema-model');

describe('editor/layers/layers-content-view/data/data-content-view', function () {
  var view;
  var querySchemaModel;

  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe',
      user_name: 'cdb',
      api_key: 'foo'
    });

    querySchemaModel = new QuerySchemaModel({
      query: 'SELECT * FROM table',
      status: 'unfetched'
    }, {
      configModel: {}
    });

    spyOn(QuerySchemaModel.prototype, 'fetch');

    var widgetDefinitionsCollection = new Backbone.Collection([
      {
        type: 'category',
        source: 'a0',
        column: 'city'
      }
    ]);

    var layerDefinitionModel = new Backbone.Model();
    spyOn(layerDefinitionModel, 'save');

    layerDefinitionModel.getAnalysisDefinitionNodeModel = function () {
      return new Backbone.Model();
    };

    var analysisDefinitionModel = new Backbone.Model({
      id: 'a0'
    });

    var tuples = [{
      columnModel: new Backbone.Model(),
      analysisDefinitionModel: analysisDefinitionModel,
      layerDefinitionModel: layerDefinitionModel
    }];

    var optionsCollection = new Backbone.Collection([
      {
        layer_index: 0,
        type: 'formula',
        name: 'location',
        tuples: tuples
      },
      {
        layer_index: 0,
        type: 'category',
        name: 'city',
        tuples: tuples
      },
      {
        layer_index: 0,
        type: 'histogram',
        name: 'cartodb_id',
        tuples: tuples
      }
    ]);

    var moreStatsModel = new Backbone.Model({
      total: 0,
      shown: 0,
      limit: 5,
      visible: false
    });

    view = new DataContentView({
      widgetDefinitionsCollection: widgetDefinitionsCollection,
      layerDefinitionModel: layerDefinitionModel,
      querySchemaModel: querySchemaModel,
      configModel: configModel,
      moreStatsModel: moreStatsModel,
      editorModel: new Backbone.Model()
    });

    spyOn(view, '_handleWidget');
    spyOn(view, 'render').and.callThrough();
    spyOn(view, '_createOptionsModels').and.callFake(function () {
      view._optionsCollection = optionsCollection;
      view._initBinds(); // rebind because we are replacing the collection
    });
    view.render();
  });

  it('should render "placeholder" if query schema model is not fetched', function () {
    expect(view.$('.FormPlaceholder-paragraph').length).toBe(4);
    expect(_.keys(view._subviews).length).toBe(0);
  });

  it('should render properly', function () {
    querySchemaModel.set('status', 'fetched');
    expect(_.keys(view._subviews).length).toBe(3);
  });

  it('should bind events properly', function () {
    querySchemaModel.set('status', 'fetched');
    expect(view.render).toHaveBeenCalled();

    view._optionsCollection.at(0).set({selected: true});
    expect(view._handleWidget).toHaveBeenCalled();
  });

  it('should not have any leaks', function () {
    expect(view).toHaveNoLeaks();
  });
});
