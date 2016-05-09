var $ = require('jquery');
var cdb = require('cartodb.js');
var Backbone = require('backbone');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');
var AnalysisDefinitionNodesCollection = require('../../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var LayerDefinitionsCollection = require('../../../../../../javascripts/cartodb3/data/layer-definitions-collection');
var AddWidgetsView = require('../../../../../../javascripts/cartodb3/components/modals/add-widgets/add-widgets-view');

describe('components/modals/add-widgets/add-widgets-view', function () {
  var LOADING_TITLE = 'loading-';

  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    var analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      sqlAPI: {},
      configModel: this.configModel
    });

    this.layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
      configModel: this.configModel,
      analysisDefinitionsCollection: {},
      analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
      mapId: 'map-123'
    });

    analysisDefinitionNodesCollection.add({
      id: 'a0',
      type: 'source',
      query: 'SELECT * FROM table_name'
    });
    analysisDefinitionNodesCollection.add({
      id: 'a1',
      type: 'buffer',
      radio: 300,
      source: 'a0'
    });
    analysisDefinitionNodesCollection.add({
      id: 'a2',
      type: 'buffer',
      radio: 300,
      source: 'a1'
    });

    this.querySchemaModel0 = analysisDefinitionNodesCollection.at(0).querySchemaModel;
    this.querySchemaModel1 = analysisDefinitionNodesCollection.at(1).querySchemaModel;
    this.querySchemaModel2 = analysisDefinitionNodesCollection.at(2).querySchemaModel;

    this.querySchemaModel0.set({ status: 'fetched', query: 'SELECT * FROM table_name' });
    this.querySchemaModel1.set({ status: 'unavailable' });
    this.querySchemaModel2.set({ query: 'SELECT * FROM test' });
    this.querySchemaModel2.set({ status: 'fetching' });

    this.dfd = $.Deferred();
    spyOn(this.querySchemaModel0, 'fetch').and.returnValue(this.dfd.promise());
    spyOn(this.querySchemaModel1, 'fetch').and.returnValue(this.dfd.promise());
    spyOn(this.querySchemaModel2, 'fetch').and.returnValue(this.dfd.promise());

    this.modalModel = new cdb.core.Model();

    this.view = new AddWidgetsView({
      modalModel: this.modalModel,
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      widgetDefinitionsCollection: new Backbone.Collection()
    });
    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should show loading msg until all are fetched', function () {
    expect(this.view.$('.js-body').html()).toContain(LOADING_TITLE);
  });

  describe('when all layer tables are fetched', function () {
    beforeEach(function () {
      this.querySchemaModel2.set('status', 'fetched');
      this.dfd.resolve();
    });

    it('should render the content view', function () {
      expect(this.view.$('.js-body').html()).not.toContain(LOADING_TITLE);
    });
  });
});
