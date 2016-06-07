var _ = require('underscore');
var test = require('tape-wrapper');
var camshaftReferenceAnalyses = require('camshaft-reference').getVersion('latest').analyses;
var analysisOptions = require('../../../../../../javascripts/cartodb3/components/modals/add-analysis/analysis-options');

test('each category excluding generated categories', function (t) {
  var defaultAnalysisOptions = analysisOptions(false);

  t.ok(defaultAnalysisOptions['generated'] === undefined, 'should not have any generated options');

  Object.keys(defaultAnalysisOptions).forEach(categoryTests.bind(this, t, defaultAnalysisOptions));

  t.end();
});

test('each category including generated categories', function (t) {
  var analysisWithGeneratedOptions = analysisOptions(true);

  t.ok(_.isObject(analysisWithGeneratedOptions['generated']), 'should also include generated options');
  t.ok(Object.keys(analysisWithGeneratedOptions).length > 1, 'should still include defaults');

  Object.keys(analysisWithGeneratedOptions).forEach(categoryTests.bind(this, t, analysisWithGeneratedOptions));

  t.end();
});

function categoryTests (t, options, category) {
  var def = options[category];

  t.ok(_.isString(category), 'category should be a alphanumeric string');
  t.ok(_.isObject(def), category + ' category definition should be an object');
  t.ok(_.isString(def.title), category + ' category should have a title');
  t.ok(_.isArray(def.analyses), category + ' should have a list of analyses');
  t.ok(def.analyses.length >= 1, category + ' should have a at least one analysis defined, otherwise might as well remove the category');

  var prefix = category + ' analysis ';
  def.analyses.forEach(function (d) {
    t.ok(_.isString(d.title), prefix + 'should have a title');
    t.ok(_.isString(d.desc), prefix + 'should have a desc');

    t.ok(_.isObject(d.nodeAttrs), prefix + 'should have an object with analysis-node-attrs');
    t.ok(camshaftReferenceAnalyses[d.nodeAttrs.type], prefix + 'should have a valid type existing in the camshaftReference');
  });
}
