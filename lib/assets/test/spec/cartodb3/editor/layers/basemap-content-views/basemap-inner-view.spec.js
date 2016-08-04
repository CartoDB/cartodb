var BasemapInnerView = require('../../../../../../javascripts/cartodb3/editor/layers/basemap-content-views/basemap-inner-view');
var BasemapsCollection = require('../../../../../../javascripts/cartodb3/editor/layers/basemap-content-views/basemaps-collection');
var CarouselCollection = require('../../../../../../javascripts/cartodb3/components/custom-carousel/custom-carousel-collection');

describe('editor/layers/basemap-content-views/basemap-inner-view', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: configModel
    });

    this.layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
      configModel: configModel,
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      mapId: 'm-123'
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

    this.categoriesCollection = new CarouselCollection([]);

    this.view = new BasemapInnerView({
      categoriesCollection: this.categoriesCollection,
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      basemapsCollection: new BasemapsCollection(),
      selectedCategoryVal: 'CARTO',
      model: {}
    });

    this.view.render();
  });

  it('should render properly', function () {
    expect(_.size(this.view._subviews)).toBe(2); // categories, select
  });

  it('should update disabled if model changes', function () {
    expect(this.view.$el.hasClass('is-disabled')).toEqual(false);
    this.view.model.set('disabled', true);
    expect(this.view.$el.hasClass('is-disabled')).toEqual(true);
    this.view.model.set('disabled', false);
    expect(this.view.$el.hasClass('is-disabled')).toEqual(false);
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
