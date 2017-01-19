var _ = require('underscore');
var Backbone = require('backbone');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');
var UserModel = require('../../../../../../javascripts/cartodb3/data/user-model');
var BasemapInnerView = require('../../../../../../javascripts/cartodb3/editor/layers/basemap-content-views/basemap-inner-view');
var BasemapsCollection = require('../../../../../../javascripts/cartodb3/editor/layers/basemap-content-views/basemaps-collection');
var CarouselCollection = require('../../../../../../javascripts/cartodb3/components/custom-carousel/custom-carousel-collection');
var AnalysisDefinitionNodesCollection = require('../../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var LayerDefinitionsCollection = require('../../../../../../javascripts/cartodb3/data/layer-definitions-collection');

describe('editor/layers/basemap-content-views/basemap-inner-view', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    var userModel = new UserModel({}, {
      configModel: configModel
    });

    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: configModel
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
      modals: {}
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
