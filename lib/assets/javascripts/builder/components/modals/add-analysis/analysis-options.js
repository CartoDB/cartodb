var _ = require('underscore');
var GeneratedAnalysisOptionModel = require('./analysis-option-models/generated-analysis-option-model');
var camshaftReference = require('camshaft-reference');
var latestCamshaftReference = camshaftReference.getVersion('latest');
var Analyses = require('builder/data/analyses');

/**
 * Analysis definitions, organized in buckets per top-level category
 *
 *  - {Obj} -> options (userModel, configModel, queryGeometryModel)
 */
module.exports = function (options) {
  var categories = {
    create_clean: {
      title: _t('analysis-category.create-clean'),
      analyses: Analyses.getAnalysesByModalCategory('create_clean', options)
    },
    data_transformation: {
      title: _t('analysis-category.data-transformation'),
      analyses: Analyses.getAnalysesByModalCategory('data_transformation', options)
    },
    analyze_predict: {
      title: _t('analysis-category.analyze-predict'),
      analyses: Analyses.getAnalysesByModalCategory('analyze_predict', options)
    }
  };

  var alsoGenerateFromCamshaftReference = options.userModel.featureEnabled('generate_analysis_options');

  if (alsoGenerateFromCamshaftReference) {
    var implementedAnalyses = _.reduce(Object.keys(categories), function (memo, category) {
      return memo.concat(
        categories[category].analyses.map(function (analysis) {
          return analysis.nodeAttrs.type;
        })
      );
    }, []);

    categories['generated'] = {
      title: 'Generated analyses by the Camshaft reference v' + _.last(camshaftReference.versions),
      analyses: _.compact(
        Object
          .keys(latestCamshaftReference.analyses)
          .filter(function (type) {
            return type !== 'source' && !_.contains(implementedAnalyses, type);
          })
          .map(function (type) {
            if (!Analyses.isAnalysisValidByType(type, options)) {
              return false;
            }

            return {
              Model: GeneratedAnalysisOptionModel,
              nodeAttrs: {type: type},
              title: type,
              desc: JSON.stringify(latestCamshaftReference.analyses[type])
            };
          })
      )
    };
  }

  return categories;
};
