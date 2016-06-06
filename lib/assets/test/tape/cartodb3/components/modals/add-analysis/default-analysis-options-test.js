var _ = require('underscore');
var test = require('tape-wrapper');
var camshaftReferenceAnalyses = require('camshaft-reference').getVersion('latest').analyses;
var defaultAnalysisOptions = require('../../../../../../javascripts/cartodb3/components/modals/add-analysis/default-analysis-options.js');

test('each category in the default-analysis-options', function (t) {
  Object.keys(defaultAnalysisOptions).forEach(function (category) {
    var def = defaultAnalysisOptions[category];

    t.ok(_.isString(category), 'category should be a alphanumeric string');
    t.ok(_.isObject(def), category + ' category definition should be an object');
    t.ok(_.isString(def.title), category + ' category should have a title');
    t.ok(_.isArray(def.analyses), category + ' should have a list of analyses');
    t.ok(def.analyses.length >= 1, category + ' should have a at least one analysis defined, otherwise might as well remove the category');

    var prefix = category + ' analyses ';
    def.analyses.forEach(function (d) {
      t.ok(_.isString(d.title), prefix + 'should have a title');
      t.ok(_.isString(d.desc), prefix + 'should have a desc');

      t.ok(camshaftReferenceAnalyses[d.nodeAttrs.type], prefix + 'should have a valid type existing in the camshaftReference');
      t.ok(_.isObject(d.nodeAttrs), prefix + 'should have an object with analysis-node-attrs');
      t.ok(_.isObject(d.nodeAttrs), prefix + 'should have an object with analysis-node-attrs');
    });
  });

  t.end();
});
