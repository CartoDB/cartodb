var cdb = require('cartodb.js');
var PrivateDashboardConfig = require('app/windshaft/private-dashboard-config');

describe('windshaft/private-dashboard-config', function () {
  beforeEach(function () {
    this.cartoDBLayer1 = new cdb.geo.CartoDBLayer({
      id: 'layer1',
      sql: 'sql1',
      cartocss: 'cartoCSS1',
      cartocss_version: '2.0'
    });
    this.cartoDBLayer2 = new cdb.geo.CartoDBLayer({
      id: 'layer2',
      sql: 'sql2',
      cartocss: 'cartoCSS2',
      cartocss_version: '2.0'
    });
    this.cartoDBLayer3 = new cdb.geo.CartoDBLayer({
      id: 'layer2',
      sql: 'sql2',
      cartocss: 'cartoCSS2',
      cartocss_version: '2.0',
      visible: false
    });
  });

  describe('.generate', function () {
    it('should generate the config', function () {
      var config = PrivateDashboardConfig.generate({
        layers: [ this.cartoDBLayer1, this.cartoDBLayer2, this.cartoDBLayer3 ]
      });

      expect(config).toEqual({ layer0: 1, layer1: 1, layer2: 0 });
    });
  });
});
