var _ = require('underscore');
var Backbone = require('backbone');
var AnalysisDefinitionNodeSourceModel = require('../../../../../javascripts/cartodb3/data/analysis-definition-node-source-model');
var LayerDefinitionModel = require('../../../../../javascripts/cartodb3/data/layer-definition-model');
var LayerContentView = require('../../../../../javascripts/cartodb3/editor/layers/layer-content-view');
var ConfigModel = require('../../../../../javascripts/cartodb3/data/config-model');
var OnboardingsServiceModel = require('../../../../../javascripts/cartodb3/components/onboardings/onboardings-service-model');
var EditorModel = require('../../../../../javascripts/cartodb3/data/editor-model');

describe('editor/layers/layer-content-view', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe',
      user_name: 'pepe'
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

    this.onboardings = new OnboardingsServiceModel();

    this.analysisDefinitionNodeModel = new AnalysisDefinitionNodeSourceModel({
      id: 'a0',
      type: 'source',
      table_name: 'foo'
    }, {
      configModel: configModel,
      collection: new Backbone.Collection()
    });

    this.widgetDefinitionsCollection = new Backbone.Collection();
    this.widgetDefinitionsCollection.isThereTimeSeries = function () {
      return false;
    };
    this.widgetDefinitionsCollection.isThereOtherWidgets = function () {
      return false;
    };

    spyOn(this.layer, 'getAnalysisDefinitionNodeModel').and.returnValue(this.analysisDefinitionNodeModel);
    spyOn(this.layer, 'findAnalysisDefinitionNodeModel').and.returnValue(this.analysisDefinitionNodeModel);

    this.stackLayoutModel = jasmine.createSpyObj('stackLayoutModel', ['prevStep']);
    this.view = new LayerContentView({
      mapDefinitionModel: this.mapDefModel,
      layerDefinitionModel: this.layer,
      analysisDefinitionsCollection: new Backbone.Collection(),
      analysisDefinitionNodesCollection: new Backbone.Collection(),
      layerDefinitionsCollection: new Backbone.Collection(),
      legendDefinitionsCollection: new Backbone.Collection(),
      widgetDefinitionsCollection: this.widgetDefinitionsCollection,
      userModel: {},
      modals: {},
      onboardings: this.onboardings,
      analysis: {},
      userActions: {},
      vis: {},
      stackLayoutModel: this.stackLayoutModel,
      configModel: configModel,
      editorModel: new EditorModel()
    });

    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render correctly', function () {
    expect(_.size(this.view._subviews)).toBe(3);
    expect(this.view.$('.Editor-HeaderInfo-titleText').text()).toContain('foo');
    expect(this.view.$('.CDB-NavMenu .CDB-NavMenu-item').length).toBe(5);
  });

  it('should go to prev stack layout step if arrow is clicked', function () {
    this.view.$('.js-back').click();
    expect(this.stackLayoutModel.prevStep).toHaveBeenCalledWith('layers');
  });
});
