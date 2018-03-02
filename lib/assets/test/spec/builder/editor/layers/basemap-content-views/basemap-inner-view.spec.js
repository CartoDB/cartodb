var _ = require('underscore');
var Backbone = require('backbone');
var ConfigModel = require('builder/data/config-model');
var UserModel = require('builder/data/user-model');
var BasemapInnerView = require('builder/editor/layers/basemap-content-views/basemap-inner-view');
var BasemapsCollection = require('builder/editor/layers/basemap-content-views/basemaps-collection');
var CarouselCollection = require('builder/components/custom-carousel/custom-carousel-collection');
var AnalysisDefinitionNodesCollection = require('builder/data/analysis-definition-nodes-collection');
var LayerDefinitionsCollection = require('builder/data/layer-definitions-collection');
var FactoryModals = require('../../../factories/modals');

describe('editor/layers/basemap-content-views/basemap-inner-view', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    var userModel = new UserModel({}, {
      configModel: configModel
    });

    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: configModel,
      userModel: userModel
    });

    this.layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
      configModel: configModel,
      userModel: userModel,
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      mapId: 'm-123',
      stateDefinitionModel: {}
    });

    this.layerDefinitionsCollection.add({
      id: 'l-1',
      kind: 'carto',
      options: {
        table_name: 'foo',
        className: 'positron_rainbow',
        category: 'CARTO'
      }
    });

    spyOn(BasemapInnerView.prototype, '_renderSelect').and.callThrough();
    var categoriesCollection = new CarouselCollection(
      [
        { selected: true, val: 'CARTO' },
        { val: 'Vizzuality' }
      ]
    );

    this.view = new BasemapInnerView({
      categoriesCollection: categoriesCollection,
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      basemapsCollection: new BasemapsCollection(),
      customBaselayersCollection: {},
      selectedCategoryVal: 'CARTO',
      model: new Backbone.Model(),
      modals: FactoryModals.createModalService()
    });

    this.view.render();
  });

  it('should render properly', function () {
    expect(_.size(this.view._subviews)).toBe(2); // categories, select
  });

  it('should render select content when a new category is selected', function () {
    this.view._categoriesCollection.at(1).set('selected', true);
    expect(BasemapInnerView.prototype._renderSelect).toHaveBeenCalled();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
