var LayerModel = require('../../../javascripts/cartodb3/layer-model');

describe('layer-model', function () {
  beforeEach(function () {
    this.layer = new LayerModel({
      id: 123
    });
    this.layer.urlRoot = function () {
      return '/layers';
    };
  });

  it('should have a widgets collection', function () {
    expect(this.layer.widgets).toBeDefined();
    expect(this.layer.widgets.url()).toEqual('/layers/123/widgets');
  });
});
