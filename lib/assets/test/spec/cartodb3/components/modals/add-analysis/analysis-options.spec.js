var Backbone = require('backbone');
var _ = require('underscore');
var camshaftReferenceAnalyses = require('camshaft-reference').getVersion('latest').analyses;
var analysisOptions = require('../../../../../../javascripts/cartodb3/components/modals/add-analysis/analysis-options');
var Analyses = require('../../../../../../javascripts/cartodb3/data/analyses');

describe('cartodb3/components/modals/add-analysis/analysis-options', function () {
  var configModel = new Backbone.Model();
  var userModel = new Backbone.Model();
  userModel.featureEnabled = function () { return true; };
  userModel.dataServiceEnabled = function () { return true; };

  it('should not add generated option if feature flag is disabled', function () {
    userModel.featureEnabled = function () { return false; };
    userModel.dataServiceEnabled = function () { return false; };
    var defaultAnalysisOptions = analysisOptions(Analyses, userModel, configModel);
    expect(defaultAnalysisOptions['generated']).toBeUndefined('should not have any generated options');
  });

  describe('each category (including generated)', function () {
    var options = analysisOptions(Analyses, userModel, configModel);

    _.each(options, function (item, category) {
      it('should have a key', function () {
        expect(category).toEqual(jasmine.any(String));
      });

      describe('category: ' + category, function () {
        describe('should have a definition', function () {
          var def = options[category];

          beforeEach(function () {
            expect(def).toEqual(jasmine.any(Object));
          });

          it('should have a title', function () {
            expect(def.title).toEqual(jasmine.any(String));
          });

          it('should have analyses', function () {
            expect(def.analyses).toEqual(jasmine.any(Array));
            expect(def.analyses.length).toBeGreaterThan(0);
          });

          describe('each analysis', function () {
            def.analyses.forEach(function (d) {
              describe('analysis: ' + d.title, function () {
                it('should have a title', function () {
                  expect(d.title).toEqual(jasmine.any(String));
                });

                it('should have a description', function () {
                  expect(d.desc).toEqual(jasmine.any(String));
                });

                it('should have attrs to create a node from', function () {
                  expect(d.nodeAttrs).toEqual(jasmine.any(Object));
                });

                it('should have at least a type', function () {
                  expect(d.nodeAttrs.type).toEqual(jasmine.any(String));
                  expect(camshaftReferenceAnalyses[d.nodeAttrs.type]).toBeDefined();
                });
              });
            });
          });
        });
      });
    });
  });
});
