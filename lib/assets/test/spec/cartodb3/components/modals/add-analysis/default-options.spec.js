var camshaftReference = require('camshaft-reference').getVersion('latest');
var defaultOptions = require('../../../../../../javascripts/cartodb3/components/modals/add-analysis/default-options');

describe('components/modals/add-analysis/default-options', function () {
  describe('all options', function () {
    it('should have a nodeAttrs object defining initial attrs when form is created', function () {
      defaultOptions.forEach(function (d) {
        expect(d.nodeAttrs).toEqual(jasmine.any(Object), 'nodeAttrs missing in ' + JSON.stringify(d));

        var type = d.nodeAttrs.type;
        expect(type).toEqual(jasmine.any(String), 'missing the type: ' + JSON.stringify(d));

        var camshaftReferenceAnalyses = camshaftReference.analyses;
        expect(camshaftReferenceAnalyses[type]).toBeDefined('type ' + type + ' is invalid, must be available in the camshaft reference' + JSON.stringify(camshaftReferenceAnalyses));
      });
    });

    it('should have a title', function () {
      defaultOptions.forEach(function (d) {
        expect(d.title).toEqual(jasmine.any(String));
      });
    });

    it('should have a desc', function () {
      defaultOptions.forEach(function (d) {
        expect(d.desc).toEqual(jasmine.any(String));
      });
    });
  });
});
