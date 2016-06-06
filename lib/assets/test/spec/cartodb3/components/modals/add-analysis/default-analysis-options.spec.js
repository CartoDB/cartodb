var camshaftReference = require('camshaft-reference').getVersion('latest');
var defaultAnalysisOptions = require('../../../../../../javascripts/cartodb3/components/modals/add-analysis/default-analysis-options');

describe('components/modals/add-analysis/default-analysis-options', function () {
  defaultAnalysisOptions.forEach(function (category) {
    describe('each category', function () {
      beforeEach(function () {
        expect(category).toEqual(jasmine.any(Object), 'should be an object defining the category, was: ' + JSON.stringify(category));
      });

      it('should have an id', function () {
        expect(category.id).toEqual(jasmine.any(String), 'should have an identifier: ' + JSON.stringify(category));
      });

      it('should have a title', function () {
        expect(category.title).toEqual(jasmine.any(String), 'should have a title: ' + JSON.stringify(category));
      });

      describe(category.id + ' analyses', function () {
        beforeEach(function () {
          expect(category.analyses).toEqual(jasmine.any(Array));
        });

        category.analyses.forEach(function (d) {
          describe('each analysis', function () {
            beforeEach(function () {
              expect(d).toEqual(jasmine.any(Object), 'should be an object defining the analysis, was: ' + JSON.stringify(d));
            });

            it('should have a nodeAttrs object defining initial attrs when form is created', function () {
              expect(d.nodeAttrs).toEqual(jasmine.any(Object), 'nodeAttrs missing in ' + JSON.stringify(d));

              var type = d.nodeAttrs.type;
              expect(type).toEqual(jasmine.any(String), 'missing the type: ' + JSON.stringify(d));

              var camshaftReferenceAnalyses = camshaftReference.analyses;
              expect(camshaftReferenceAnalyses[type]).toBeDefined('type ' + type + ' is invalid, must be available in the camshaft reference' + JSON.stringify(camshaftReferenceAnalyses));
            });

            it('should have a title', function () {
              expect(d.title).toEqual(jasmine.any(String));
            });

            it('should have a desc', function () {
              expect(d.desc).toEqual(jasmine.any(String));
            });
          });
        });
      });
    });
  });
});
