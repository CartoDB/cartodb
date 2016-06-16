var _ = require('underscore');
var camshaftReference = require('camshaft-reference');
var latestCamshaftReference = camshaftReference.getVersion('latest');
var PointInPolygonAnalysisOptionModel = require('./analysis-option-models/point-in-polygon-analysis-option-model');
var WeightedCentroidAnalysisOptionModel = require('./analysis-option-models/analysis-option-model');
var KMeansAnalysisOptionModel = require('./analysis-option-models/analysis-option-model');
var MoranAnalysisOptionModel = require('./analysis-option-models/analysis-option-model');
var GeneratedAnalysisOptionModel = require('./analysis-option-models/generated-analysis-option-model');

var AREA_OF_INFLUENCE_TYPE_GROUP = _t('analyses.area-of-influence');

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
          title: _t('components.modals.add-analysis.option-types.buffer.title'),
          type_group: AREA_OF_INFLUENCE_TYPE_GROUP,
          desc: _t('components.modals.add-analysis.option-types.buffer.desc')
        }, {
          nodeAttrs: {
            type: 'trade-area',
            kind: 'car',
            isolines: 1,
            dissolved: false,
            time: 100
          },
          title: _t('components.modals.add-analysis.option-types.trade-area.title'),
          type_group: AREA_OF_INFLUENCE_TYPE_GROUP,
          desc: _t('components.modals.add-analysis.option-types.trade-area.desc')
        }
      ]
    },

    relationship_analysis: {
      title: _t('analysis-category.relationship-analysis'),
      analyses: [
        {
          Model: PointInPolygonAnalysisOptionModel,
          nodeAttrs: {
            type: 'point-in-polygon'
          },
          title: _t('components.modals.add-analysis.option-types.point-in-polygon.title'),
          desc: _t('components.modals.add-analysis.option-types.point-in-polygon.desc')
        }, {
          Model: MoranAnalysisOptionModel,
          nodeAttrs: {
            type: 'moran'
          },
          title: _t('components.modals.add-analysis.option-types.moran.title'),
          desc: _t('components.modals.add-analysis.option-types.moran.desc')
        }, {
          Model: KMeansAnalysisOptionModel,
          nodeAttrs: {
            type: 'kmeans'
          },
          title: _t('components.modals.add-analysis.option-types.kmeans.title'),
          desc: _t('components.modals.add-analysis.option-types.kmeans.desc')
        }, {
          Model: WeightedCentroidAnalysisOptionModel,
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
