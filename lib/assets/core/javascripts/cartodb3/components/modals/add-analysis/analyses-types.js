var _ = require('underscore');
var AnalysisCategoryView = require('./analysis-category-pane-view');

module.exports = function (analysisOptions) {
  return [{
    type: 'create_clean',
    createTabPaneItem: function (optionsCollection, opts) {
      return {
        label: _t('analysis-category.create-clean'),
        name: 'create_clean',
        createContentView: function () {
          return new AnalysisCategoryView(_.extend({
            analysisOptions: analysisOptions,
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
        label: _t('analysis-category.analyze-predict'),
        name: 'analyze_predict',
        createContentView: function () {
          return new AnalysisCategoryView(_.extend({
            analysisOptions: analysisOptions,
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
        label: _t('analysis-category.data-transformation'),
        name: 'data_transformation',
        createContentView: function () {
          return new AnalysisCategoryView(_.extend({
            analysisOptions: analysisOptions,
            analysisType: 'data_transformation',
            collection: optionsCollection
          }, opts));
        }
      };
    }
  }];
};
