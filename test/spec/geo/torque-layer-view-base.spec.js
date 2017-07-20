var TorqueLayer = require('../../../src/geo/map/torque-layer');
var VisModel = require('../../../src/vis/vis');
var TorqueLayerViewBase = require('../../../src/geo/torque-layer-view-base');

describe('geo/torque-layer-base-view', function () {
  beforeEach(function () {
    this.vis = new VisModel();
    this.model = new TorqueLayer({
      type: 'torque',
      query: 'select * from table',
      sql_wrap: 'select * from (<%= sql %>) as _cdbfromsqlwrap',
      query_wrapper: 'select * from (<%= sql %>) as _cdbfromquerywrapper',
      cartocss: 'Map {}',
      dynamic_cdn: 'dynamic-cdn-value'
    }, { vis: this.vis });
  });

  describe('_getQuery', function () {
    it('should take sql_wrap in case it is defined', function () {
      var query = TorqueLayerViewBase._getQuery(this.model);
      expect(query).toBe('select * from (select * from table) as _cdbfromsqlwrap');
    });

    it('should not take query_wrapper in case sql_wrap is not defined', function () {
      this.model.unset('sql_wrap');
      var query = TorqueLayerViewBase._getQuery(this.model);
      expect(query).toBe('select * from table');
    });
  });
});
