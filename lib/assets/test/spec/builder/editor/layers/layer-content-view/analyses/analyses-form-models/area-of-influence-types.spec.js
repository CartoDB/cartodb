var AREA_OF_INFLUENCE_TYPES = require('builder/editor/layers/layer-content-views/analyses/analysis-form-models/area-of-influence-types');

describe('editor/layers/layer-content-views/analyses/analysis-form-models/area-of-influence-types', function () {
  AREA_OF_INFLUENCE_TYPES.forEach(function (d) {
    it('should have a type', function () {
      expect(d.type).toEqual(jasmine.any(String));
    });

    describe('area-of-influence type ' + d.type, function () {
      it('should have a label', function () {
        expect(d.label).toEqual(jasmine.any(String));
      });

      it('should have parametersDataFields defined with which schema props to use', function () {
        expect(d.parametersDataFields).toEqual(jasmine.any(String), 'on the format of "source,type,some_other,…"');
        expect(d.parametersDataFields).not.toContain(' ', 'the parametersDataFields must not contain any spaces');
      });

      it('should have a parse function', function () {
        expect(d.parse).toEqual(jasmine.any(Function));
        expect(d.parse.length).toEqual(1, 'should take one argument, which is the attrs from the analysis-definition-node-model');
      });

      it('should have a formatAttrs function', function () {
        expect(d.formatAttrs).toEqual(jasmine.any(Function));
        expect(d.formatAttrs.length).toEqual(1, 'should take one argument of the area-of-influence-form-model');
      });
    });
  });
});
