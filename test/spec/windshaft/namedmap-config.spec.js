var CartoDBLayer = require('../../../src/geo/map/cartodb-layer');
var NamedMapConfig = require('../../../src/windshaft/namedmap-config');

describe('windshaft/namedmap-config', function () {
  beforeEach(function () {
    this.cartoDBLayer1 = new CartoDBLayer({
      id: 'layer1',
      sql: 'sql1',
      cartocss: 'cartoCSS1',
      cartocss_version: '2.0'
    });
    this.cartoDBLayer2 = new CartoDBLayer({
      id: 'layer2',
      sql: 'sql2',
      cartocss: 'cartoCSS2',
      cartocss_version: '2.0'
    });
    this.cartoDBLayer3 = new CartoDBLayer({
      id: 'layer2',
      sql: 'sql2',
      cartocss: 'cartoCSS2',
      cartocss_version: '2.0',
      visible: false
    });
  });

  describe('.generate', function () {
    it('should generate the config', function () {
      var config = NamedMapConfig.generate({
        layers: [ this.cartoDBLayer1, this.cartoDBLayer2, this.cartoDBLayer3 ]
      });

      expect(config).toEqual({ layer0: 1, layer1: 1, layer2: 0 });
    });
  });
});
