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

    analysisDefinitionNodesCollection.at(1).analysisTableModel.set({ status: 'ready', query: 'SELECT * FROM test' });
    analysisDefinitionNodesCollection.at(2).analysisTableModel.set({ status: 'ready', query: 'SELECT * FROM test2' });

    this.analysisTableModel0 = analysisDefinitionNodesCollection.at(0).analysisTableModel;
    this.analysisTableModel1 = analysisDefinitionNodesCollection.at(1).analysisTableModel;
    this.analysisTableModel2 = analysisDefinitionNodesCollection.at(2).analysisTableModel;
    this.analysisTableModel2.set('fetched', true);

    analysisDefinitionNodesCollection.at(1).analysisTableModel.set({ status: 'ready', query: 'SELECT * FROM test' });
    spyOn(this.analysisTableModel0, 'fetch');
    spyOn(this.analysisTableModel1, 'fetch');
    spyOn(this.analysisTableModel2, 'fetch');

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

  it('should only fetch unfetched layer tables', function () {
    expect(this.analysisTableModel0.fetch).toHaveBeenCalled();
    expect(this.analysisTableModel1.fetch).toHaveBeenCalled();
    expect(this.analysisTableModel2.fetch).not.toHaveBeenCalled();
  });

  it('should show loading msg until fetched', function () {
    expect(this.view.$('.js-body').html()).toContain(LOADING_TITLE);
  });

  describe('when all layer tables are fetched', function () {
    beforeEach(function () {
      this.analysisTableModel0.set('fetched', true);
      this.analysisTableModel0.trigger('sync');
      this.analysisTableModel1.set('fetched', true);
      this.analysisTableModel1.trigger('sync');
    });

    it('should render the content view', function () {
      expect(this.view.$('.js-body').html()).not.toContain(LOADING_TITLE);
    });
  });

  describe('when a layer fails', function () {
    beforeEach(function () {
      this.analysisTableModel1.trigger('error');
    });

    it('should render a error view', function () {
      var html = this.view.$('.js-body').html();
      expect(html).not.toContain(LOADING_TITLE);
      expect(html).toContain('error');
    });
  });

  describe('when an analysis is not ready', function () {
    beforeEach(function () {
      var analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
        sqlAPI: {},
        configModel: this.configModel
      });

      var layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
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

      this.analysisTableModel = analysisDefinitionNodesCollection.at(0).analysisTableModel;
      this.analysisTableModel.set('status', 'failed');
      spyOn(this.analysisTableModel, 'fetch');

      var view = new AddWidgetsView({
        modalModel: this.modalModel,
        layerDefinitionsCollection: layerDefinitionsCollection,
        widgetDefinitionsCollection: new Backbone.Collection()
      });

      view.render();
    });

    it('should not fetch it', function () {
      expect(this.analysisTableModel.fetch).not.toHaveBeenCalled();
    });
  });
});
