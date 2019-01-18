var Backbone = require('backbone');
var TorqueLayer = require('../../../src/geo/map/torque-layer');
var TorqueLayerViewBase = require('../../../src/geo/torque-layer-view-base');
var _ = require('underscore');
var createEngine = require('../fixtures/engine.fixture.js');

describe('geo/torque-layer-base-view', function () {
  var engineMock;
  beforeEach(function () {
    spyOn(TorqueLayerViewBase, '_cartoCSSChanged').and.callThrough();
    spyOn(TorqueLayerViewBase, '_onUpdateDuration').and.callThrough();

    engineMock = createEngine();
    this.model = new TorqueLayer({
      type: 'torque',
      table_name: 'table',
      sql_wrap: 'select * from (<%= sql %>) as _cdbfromsqlwrap',
      query_wrapper: 'select * from (<%= sql %>) as _cdbfromquerywrapper',
      cartocss: 'Map {}',
      dynamic_cdn: 'dynamic-cdn-value'
    }, { engine: engineMock });
  });

  describe('_getQuery', function () {
    describe('without source', function () {
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

    describe('with source', function () {
      var sourceMock = new Backbone.Model({
        query: 'select * from new_table'
      });

      beforeEach(function () {
        this.model.set('source', sourceMock);
      });

      it('should take sql_wrap in case it is defined', function () {
        var query = TorqueLayerViewBase._getQuery(this.model);
        expect(query).toBe('select * from (select * from new_table) as _cdbfromsqlwrap');
      });

      it('should not take query_wrapper in case sql_wrap is not defined', function () {
        this.model.unset('sql_wrap');
        var query = TorqueLayerViewBase._getQuery(this.model);
        expect(query).toBe('select * from new_table');
      });

      afterEach(function () {
        this.model.unset('source');
      });
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
