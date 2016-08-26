var _ = require('underscore');
var camshaftReference = require('camshaft-reference');
var latestCamshaftReference = camshaftReference.getVersion('latest');
var GeneratedAnalysisOptionModel = require('./analysis-option-models/generated-analysis-option-model');
var MergeAnalysisOptionModel = require('./analysis-option-models/merge-analysis-option-model');

/**
 * Analysis definitions, organized in buckets per top-level category
 * @param {Bool} [alsoGenerateFromCamshaftReference = false]
 */
module.exports = function (alsoGenerateFromCamshaftReference) {
  var categories = {
    create_clean: {
      title: _t('analysis-category.create-clean'),
      analyses: [
        {
          nodeAttrs: {
            type: 'georeference-long-lat'
          },
          title: _t('components.modals.add-analysis.option-types.georeference.title'),
          desc: _t('components.modals.add-analysis.option-types.georeference.desc')
        }, {
          nodeAttrs: {
            type: 'data-observatory-measure'
          },
          title: _t('components.modals.add-analysis.option-types.data-observatory-measure.title'),
          desc: _t('components.modals.add-analysis.option-types.data-observatory-measure.desc')
        }, {
          nodeAttrs: {
            type: 'merge'
          },
          Model: MergeAnalysisOptionModel,
          title: _t('components.modals.add-analysis.option-types.merge.title'),
          desc: _t('components.modals.add-analysis.option-types.merge.desc')
        }, {
          nodeAttrs: {
            type: 'filter-by-node-column'
          },
          title: _t('components.modals.add-analysis.option-types.filter-by-node-column.title'),
          desc: _t('components.modals.add-analysis.option-types.filter-by-node-column.desc')
        }
      ]
    },

    data_transformation: {
      title: _t('analysis-category.data-transformation'),
      analyses: [
        {
          nodeAttrs: {
            type: 'line-to-single-point'
          },
          title: _t('components.modals.add-analysis.option-types.connect-with-lines.title'),
          desc: _t('components.modals.add-analysis.option-types.connect-with-lines.desc')
        }, {
          nodeAttrs: {
            type: 'centroid'
          },
          title: _t('components.modals.add-analysis.option-types.centroid.title'),
          desc: _t('components.modals.add-analysis.option-types.centroid.desc')
        }, {
          nodeAttrs: {
            type: 'convex-hull'
          },
          title: _t('components.modals.add-analysis.option-types.group-points.title'),
          desc: _t('components.modals.add-analysis.option-types.group-points.desc')
        }, {
          nodeAttrs: {
            type: 'buffer',
            radius: 100
          },
          title: _t('components.modals.add-analysis.option-types.area-of-influence.title'),
          desc: _t('components.modals.add-analysis.option-types.area-of-influence.desc')
        }, {
          nodeAttrs: {
            type: 'aggregate-intersection'
          },
          title: _t('components.modals.add-analysis.option-types.aggregate-intersection.title'),
          desc: _t('components.modals.add-analysis.option-types.aggregate-intersection.desc')
        }, {
          nodeAttrs: {
            type: 'intersection'
          },
          title: _t('components.modals.add-analysis.option-types.filter-intersection.title'),
          desc: _t('components.modals.add-analysis.option-types.filter-intersection.desc')
        }, {
          nodeAttrs: {
            type: 'filter-range'
          },
          title: _t('components.modals.add-analysis.option-types.filter.title'),
          desc: _t('components.modals.add-analysis.option-types.filter.desc')
        }, {
          nodeAttrs: {
            type: 'sampling'
          },
          title: _t('components.modals.add-analysis.option-types.sampling.title'),
          desc: _t('components.modals.add-analysis.option-types.sampling.desc')
        }
      ]
    },

    analyze_predict: {
      title: _t('analysis-category.analyze-predict'),
      analyses: [
        {
          nodeAttrs: {
            type: 'kmeans'
          },
          title: _t('components.modals.add-analysis.option-types.kmeans.title'),
          desc: _t('components.modals.add-analysis.option-types.kmeans.desc')
        }, {
          nodeAttrs: {
            type: 'moran'
          },
          title: _t('components.modals.add-analysis.option-types.moran-cluster.title'),
          desc: _t('components.modals.add-analysis.option-types.moran-cluster.desc')
        }, {
          nodeAttrs: {
            type: 'spatial-markov-trend'
          },
          title: _t('components.modals.add-analysis.option-types.spatial-markov-trend.title'),
          desc: _t('components.modals.add-analysis.option-types.spatial-markov-trend.desc')
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
