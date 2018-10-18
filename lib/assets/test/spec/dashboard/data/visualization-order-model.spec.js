const VisualizationOrderModel = require('dashboard/data/visualization-order-model');

describe('dashboard/data/visualization-order-model', function () {
  let model, visualization, url;

  beforeEach(function () {
    url = 'wadus.com';

    visualization = {
      id: 1337,
      url: () => url
    };

    model = new VisualizationOrderModel({
      visualization
    });
  });

  describe('.initialize', function () {
    it('sets this.visualization and unsets it from the attributes', function () {
      expect(model.get('visualization')).toBeUndefined();
      expect(model.visualization).toEqual(visualization);
    });
  });

  describe('.url', function () {
    it('returns the url properly', function () {
      expect(model.url()).toEqual(`${url}/next_id`);
    });
  });
});
