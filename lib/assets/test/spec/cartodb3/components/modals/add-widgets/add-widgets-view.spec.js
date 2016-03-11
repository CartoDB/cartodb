var cdb = require('cartodb.js');
var Backbone = require('backbone');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');
var AnalysisDefinitionNodesCollection = require('../../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var LayerDefinitionsCollection = require('../../../../../../javascripts/cartodb3/data/layer-definitions-collection');
var AddWidgetsView = require('../../../../../../javascripts/cartodb3/components/modals/add-widgets/add-widgets-view');

describe('components/modals/add-widgets/add-widgets-view', function () {
  var FETCHING_TITLE = 'fetching-';

  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    var layersCollection = new Backbone.Collection();
    var analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection();
    this.layerDefinitionsCollection = new LayerDefinitionsCollection([], {
      configModel: configModel,
      layersCollection: layersCollection,
      analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
      mapId: 'map-123'
    });

    this.layerDefinitionsCollection.add({
      id: 'l0',
      options: {
        type: 'Tiled'
      }
    });
    this.layerDefinitionsCollection.add({
      id: 'l1',
      options: {
        type: 'CartoDB',
        table_name: 'foobar'
      }
    });
    this.layerDefinitionsCollection.add({
      id: 'l2',
      options: {
        type: 'CartoDB',
        table_name: 'foobar'
      }
    });
    this.lt1 = this.layerDefinitionsCollection.at(1).layerTableModel;
    this.lt2 = this.layerDefinitionsCollection.at(2).layerTableModel;
    this.lt2.set('fetched', true);

    spyOn(this.lt1, 'fetch');
    spyOn(this.lt2, 'fetch');

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
    expect(this.lt1.fetch).toHaveBeenCalled();
    expect(this.lt2.fetch).not.toHaveBeenCalled();
  });

  it('should show loading msg until fetched', function () {
    expect(this.view.$('.js-body').html()).toContain(FETCHING_TITLE);
  });

  describe('when all layer tables are fetched', function () {
    beforeEach(function () {
      this.lt1.set('fetched', true);
      this.lt1.trigger('sync');
    });

    it('should render the content view', function () {
      expect(this.view.$('.js-body').html()).not.toContain(FETCHING_TITLE);
    });
  });

  describe('when a layer fails', function () {
    beforeEach(function () {
      this.lt1.trigger('error');
    });

    it('should render a error view', function () {
      var html = this.view.$('.js-body').html();
      expect(html).not.toContain(FETCHING_TITLE);
      expect(html).toContain('error');
    });
  });
});
