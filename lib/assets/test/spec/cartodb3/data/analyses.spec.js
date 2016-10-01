var Backbone = require('backbone');
var analyses = require('../../../../javascripts/cartodb3/data/analyses');
var camshaftReference = require('camshaft-reference').getVersion('latest');
var UnknownTypeFormModel = require('../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analysis-form-models/unknown-type-form-model');
var FallbackFormModel = require('../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analysis-form-models/fallback-form-model');

describe('cartodb3/data/analyses', function () {
  Object.keys(analyses.MAP).forEach(function (key) {
    var def = analyses.MAP[key];

    describe(key + ' item', function () {
      it('should have a title', function () {
        expect(def.title).toEqual(jasmine.any(String));
      });

      it('should have a FormModel', function () {
        expect(def.FormModel).toEqual(jasmine.any(Function));
      });
    });
  }, this);

  describe('.findFormModelByType', function () {
    describe('when given an unknown type', function () {
      it('should return an unknown model', function () {
        expect(analyses.findFormModelByType('unknown-indeed')).toBe(UnknownTypeFormModel);
        expect(analyses.findFormModelByType()).toBe(UnknownTypeFormModel);
        expect(analyses.findFormModelByType({})).toBe(UnknownTypeFormModel);
        expect(analyses.findFormModelByType(true)).toBe(UnknownTypeFormModel);
        expect(analyses.findFormModelByType(false)).toBe(UnknownTypeFormModel);
      });
    });

    describe('when given a type which is not implemented (yet)', function () {
      beforeEach(function () {
        camshaftReference.analyses['just-for-testing'] = {};
      });

      afterEach(function () {
        delete camshaftReference['just-for-testing'];
      });

      it('should return fallback model', function () {
        expect(analyses.findFormModelByType('just-for-testing')).toBe(FallbackFormModel);
      });
    });

    describe('when given an implemented type', function () {
      it('should return its formModel', function () {
        var BufferFormModel = analyses.findFormModelByType('buffer');
        expect(BufferFormModel).toBeDefined();
        expect(BufferFormModel).not.toBe(UnknownTypeFormModel);
        expect(BufferFormModel).not.toBe(FallbackFormModel);
      });
    });
  });

  describe('.title', function () {
    describe('when given an unknown type', function () {
      it('should return unknown title', function () {
        expect(analyses.title()).toEqual('analyses.unknown');
        expect(analyses.title('')).toEqual('analyses.unknown');
        expect(analyses.title({})).toEqual('analyses.unknown');
        expect(analyses.title(true)).toEqual('analyses.unknown');
      });
    });

    describe('when given a type which is not implemented (yet)', function () {
      beforeEach(function () {
        camshaftReference.analyses['just-for-testing'] = {};
      });

      afterEach(function () {
        delete camshaftReference['just-for-testing'];
      });

      it('should return the default for type', function () {
        expect(analyses.title('just-for-testing')).toEqual('analyses.just-for-testing');
      });
    });

    describe('when given a implemented type', function () {
      it('should return a corresponding title', function () {
        expect(analyses.title('buffer')).toEqual(jasmine.any(String));
        expect(analyses.title('buffer')).not.toContain('unknown');
      });
    });

    describe('when given a DO analysis', function () {
      it('should return the measurement as the title for the DO analysis if implemented', function () {
        var model = new Backbone.Model({
          type: 'data-observatory-measure',
          measurement: 'age-and-gender'
        });
        expect(analyses.title(model)).toEqual('analyses.data-observatory-measure.age-and-gender');
      });

      it('should return the default title if the measurement is not implemented', function () {
        var model = new Backbone.Model({
          type: 'data-observatory-measure',
          measurement: 'something-very-new'
        });
        expect(analyses.title(model)).toEqual('analyses.data-observatory-measure.short-title');
      });
    });

    describe('when given a model', function () {
      it('should return the corresponding title', function () {
        var model = new Backbone.Model({type: 'buffer'});
        expect(analyses.title(model)).toEqual(jasmine.any(String));
        expect(analyses.title(model)).not.toContain('unknown');
        expect(analyses.title(model)).toEqual(analyses.title('buffer'));
      });
    });
  });
});
