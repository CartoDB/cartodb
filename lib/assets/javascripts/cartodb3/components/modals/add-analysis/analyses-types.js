var _ = require('underscore');
var AnalysisCategoryView = require('./analysis-category-pane-view');

module.exports = [{
  type: 'create_clean',
  createTabPaneItem: function (optionsCollection, opts) {
    return {
      label: 'Create and clean',
      name: 'create_clean',
      createContentView: function () {
        return new AnalysisCategoryView(_.extend({
          analysisType: 'create_clean',
          collection: optionsCollection
        }, opts));
      }
    };
  }
}, {
  type: 'analyze_predict',
  createTabPaneItem: function (optionsCollection, opts) {
    return {
      label: 'Analyze and predicte',
      name: 'analyze_predict',
      createContentView: function () {
        return new AnalysisCategoryView(_.extend({
          analysisType: 'analyze_predict',
          collection: optionsCollection
        }, opts));
      }
    };
  }
}, {
  type: 'data_transformation',
  createTabPaneItem: function (optionsCollection, opts) {
    return {
      label: 'Transform',
      name: 'data_transformation',
      createContentView: function () {
        return new AnalysisCategoryView(_.extend({
          analysisType: 'data_transformation',
          collection: optionsCollection
        }, opts));
      }
    };
  }
}];
