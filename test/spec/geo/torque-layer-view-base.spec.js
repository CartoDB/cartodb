var Backbone = require('backbone');
var TorqueLayer = require('../../../src/geo/map/torque-layer');
var VisModel = require('../../../src/vis/vis');
var TorqueLayerViewBase = require('../../../src/geo/torque-layer-view-base');
var _ = require('underscore');

describe('geo/torque-layer-base-view', function () {
  beforeEach(function () {
    spyOn(TorqueLayerViewBase, '_cartoCSSChanged').and.callThrough();
    spyOn(TorqueLayerViewBase, '_onUpdateDuration').and.callThrough();

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

  describe('_initBinds', function () {
    var test;

    beforeEach(function () {
      var FakeObj = function () {};
      FakeObj.prototype = _.extend(
        {
          stopListening: function () {}
        },
        Backbone.Events,
        TorqueLayerViewBase
      );

      test = new FakeObj();
      test.model = this.model;
      test.nativeTorqueLayer = {
        setCartoCSS: function () {},
        animator: {
          duration: function () {}
        }
      };
      spyOn(test.nativeTorqueLayer.animator, 'duration');
      test._onModel();
    });

    it('should apply cartocss to native torque layer', function () {
      this.model.set('cartocss', 'Map { -torque-animation-duration: 30 }');
      expect(TorqueLayerViewBase._cartoCSSChanged).toHaveBeenCalled();
    });

    it('should change animation durator when customDuration changes', function () {
      this.model.set('customDuration', 10);
      expect(TorqueLayerViewBase._onUpdateDuration).toHaveBeenCalled();
      expect(test.nativeTorqueLayer.animator.duration).toHaveBeenCalledWith(10);
    });
  });
});
