var VisualizationModel = require('../../../../javascripts/cartodb3/data/visualization-model');

describe('visualization-model', function () {
  beforeEach(function () {
    this.model = new VisualizationModel({
      urlRoot: '/bampadam',
      id: 9000
    });
  });

  it('should have a layerDefinitionsCollectionCollection', function () {
    expect(this.model.layerDefinitionsCollection).toBeDefined();
    expect(this.model.layerDefinitionsCollection.url()).toEqual('/bampadam/api/v3/maps/9000/layers');
  });

  it('should have a widgetDefinitionsCollectionCollection', function () {
    expect(this.model.widgetDefinitionsCollection).toBeDefined();
  });
});
