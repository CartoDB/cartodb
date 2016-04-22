var cdb = require('cartodb.js');
var Backbone = require('backbone');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');
var AnalysisDefinitionNodesCollection = require('../../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var AnalysisTableModel = require('../../../../../../javascripts/cartodb3/data/analysis-table-model');
var LayerDefinitionsCollection = require('../../../../../../javascripts/cartodb3/data/layer-definitions-collection');
var AddWidgetsView = require('../../../../../../javascripts/cartodb3/components/modals/add-widgets/add-widgets-view');
var createDefaultVis = require('../../../create-default-vis');

describe('components/modals/add-widgets/add-widgets-view', function () {
  var LOADING_TITLE = 'loading-';

  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    var vis = createDefaultVis();
    var analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      sqlAPI: {},
      configModel: configModel,
      analysisCollection: []
    });

    this.layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
      configModel: configModel,
      visMap: vis.map,
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
    analysisDefinitionNodesCollection.at(1).analysisTableModel = new AnalysisTableModel({}, {
      configModel: configModel
    });
    analysisDefinitionNodesCollection.at(2).analysisTableModel = new AnalysisTableModel({}, {
      configModel: configModel
    });

    this.analysis1 = analysisDefinitionNodesCollection.at(1).analysisTableModel;
    this.analysis2 = analysisDefinitionNodesCollection.at(2).analysisTableModel;
    this.analysis2.set('fetched', true);

    spyOn(this.analysis1, 'fetch');
    spyOn(this.analysis2, 'fetch');

    this.modalmodel = new cdb.core.Model();
    this.view = new AddWidgetsView({
      modalModel: this.modalmodel,
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      widgetDefinitionsCollection: new Backbone.Collection()
    });
    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should only fetch unfetched layer tables', function () {
    expect(this.analysis1.fetch).toHaveBeenCalled();
    expect(this.analysis2.fetch).not.toHaveBeenCalled();
  });

  it('should show loading msg until fetched', function () {
    expect(this.view.$('.js-body').html()).toContain(LOADING_TITLE);
  });

  describe('when all layer tables are fetched', function () {
    beforeEach(function () {
      this.analysis1.set('fetched', true);
      this.analysis1.trigger('sync');
    });

    it('should render the content view', function () {
      expect(this.view.$('.js-body').html()).not.toContain(LOADING_TITLE);
    });
  });

  describe('when a layer fails', function () {
    beforeEach(function () {
      this.analysis1.trigger('error');
    });

    it('should render a error view', function () {
      var html = this.view.$('.js-body').html();
      expect(html).not.toContain(LOADING_TITLE);
      expect(html).toContain('error');
    });
  });
});
