var _ = require('underscore');
var camshaftReference = require('camshaft-reference');
var latestCamshaftReference = camshaftReference.getVersion('latest');
var GeneratedAnalysisOptionModel = require('./analysis-option-models/generated-analysis-option-model');

/**
 * Analysis definitions, organized in buckets per top-level category
 * @param {Bool} [alsoGenerateFromCamshaftReference = false]
 */
module.exports = function (alsoGenerateFromCamshaftReference) {
  var categories = {
    data_transformation: {
      title: _t('analysis-category.data-transformation'),
      analyses: [
        {
          nodeAttrs: {
            type: 'buffer',
            radius: 100
          },
          title: _t('components.modals.add-analysis.option-types.area-of-influence.title'),
          desc: _t('components.modals.add-analysis.option-types.area-of-influence.desc')
        }, {
          nodeAttrs: {
            type: 'filter-range'
          },
          title: _t('components.modals.add-analysis.option-types.filter.title'),
          type_group: _t('analyses.filter'),
          desc: _t('components.modals.add-analysis.option-types.filter.desc')
        }
      ]
    },

    relationship_analysis: {
      title: _t('analysis-category.relationship-analysis'),
      analyses: [
        {
          nodeAttrs: {
            type: 'filter-by-node-column'
          },
          title: _t('components.modals.add-analysis.option-types.filter-by-node-column.title'),
          desc: _t('components.modals.add-analysis.option-types.filter-by-node-column.desc')
        }, {
          nodeAttrs: {
            type: 'moran'
          },
          title: _t('components.modals.add-analysis.option-types.moran-cluster.title'),
          desc: _t('components.modals.add-analysis.option-types.moran-cluster.desc')
        }, {
          nodeAttrs: {
            type: 'kmeans'
          },
          title: _t('components.modals.add-analysis.option-types.kmeans.title'),
          desc: _t('components.modals.add-analysis.option-types.kmeans.desc')
        }, {
          nodeAttrs: {
            type: 'intersection'
          },
          title: _t('components.modals.add-analysis.option-types.intersection.title'),
          desc: _t('components.modals.add-analysis.option-types.intersection.desc')
        }, {
          nodeAttrs: {
            type: 'weighted-centroid'
          },
          title: _t('components.modals.add-analysis.option-types.weighted-centroid.title'),
          desc: _t('components.modals.add-analysis.option-types.weighted-centroid.desc')
        }
      ]
    }
  };

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
      analyses: Object
        .keys(latestCamshaftReference.analyses)
        .filter(function (type) {
          return type !== 'source' && !_.contains(implementedAnalyses, type);
        })
        .map(function (type) {
          return {
            Model: GeneratedAnalysisOptionModel,
            nodeAttrs: {type: type},
            title: type,
            desc: JSON.stringify(latestCamshaftReference.analyses[type])
          };
        })
    };
  }

  return categories;
};
