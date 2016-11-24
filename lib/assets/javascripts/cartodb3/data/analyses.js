var _ = require('underscore');
var camshaftReference = require('./camshaft-reference');
var AreaOfInfluenceFormModel = require('../editor/layers/layer-content-views/analyses/analysis-form-models/area-of-influence-form-model');
var AggregateIntersectionFormModel = require('../editor/layers/layer-content-views/analyses/analysis-form-models/aggregate-intersection-form-model');
var FilterIntersectionFormModel = require('../editor/layers/layer-content-views/analyses/analysis-form-models/filter-intersection-form-model');
var FallbackFormModel = require('../editor/layers/layer-content-views/analyses/analysis-form-models/fallback-form-model');
var UnknownTypeFormModel = require('../editor/layers/layer-content-views/analyses/analysis-form-models/unknown-type-form-model');
var MergeAnalysisOptionModel = require('../components/modals/add-analysis/analysis-option-models/merge-analysis-option-model');

var DAO_TYPES = ['age-and-gender', 'boundaries', 'education', 'employment', 'families', 'housing', 'income', 'language', 'migration', 'nationality', 'population-segments', 'race-and-ethnicity', 'religion', 'transportation'];

var MAP = {
  'aggregate-intersection': {
    title: _t('analyses.aggregate-intersection.short-title'),
    FormModel: AggregateIntersectionFormModel,
    modalTitle: _t('components.modals.add-analysis.option-types.aggregate-intersection.title'),
    modalDesc: _t('components.modals.add-analysis.option-types.aggregate-intersection.desc'),
    modalCategory: 'data_transformation'
  },
  'bounding-box': {
    title: _t('analyses.bounding-box.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/group-points-form-model')
  },
  'bounding-circle': {
    title: _t('analyses.bounding-circle.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/group-points-form-model')
  },
  'buffer': {
    title: _t('analyses.area-of-influence.short-title'),
    FormModel: AreaOfInfluenceFormModel,
    modalTitle: _t('components.modals.add-analysis.option-types.area-of-influence.title'),
    modalDesc: _t('components.modals.add-analysis.option-types.area-of-influence.desc'),
    modalCategory: 'data_transformation'
  },
  'centroid': {
    title: _t('analyses.centroid.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/centroid-form-model'),
    modalTitle: _t('components.modals.add-analysis.option-types.centroid.title'),
    modalDesc: _t('components.modals.add-analysis.option-types.centroid.desc'),
    modalCategory: 'data_transformation'
  },
  'convex-hull': {
    title: _t('analyses.convex-hull.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/group-points-form-model'),
    modalTitle: _t('components.modals.add-analysis.option-types.group-points.title'),
    modalDesc: _t('components.modals.add-analysis.option-types.group-points.desc'),
    modalCategory: 'data_transformation'
  },
  'concave-hull': {
    title: _t('analyses.concave-hull.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/group-points-form-model')
  },
  'data-observatory-measure': {
    title: _t('analyses.data-observatory-measure.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/data-observatory-measure-model'),
    modalTitle: _t('components.modals.add-analysis.option-types.data-observatory-measure.title'),
    modalDesc: _t('components.modals.add-analysis.option-types.data-observatory-measure.desc'),
    modalCategory: 'create_clean',
    checkIfValid: function (userModel, configModel) {
      return checkIfValidByCustomInstall(userModel, configModel);
    }
  },
  'filter-by-node-column': {
    title: _t('analyses.filter-by-node-column.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/filter-by-node-column'),
    modalTitle: _t('components.modals.add-analysis.option-types.filter-by-node-column.title'),
    modalDesc: _t('components.modals.add-analysis.option-types.filter-by-node-column.desc'),
    modalCategory: 'create_clean'
  },
  'filter-category': {
    title: _t('analyses.filter.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/filter-form-model')
  },
  'filter-range': {
    title: _t('analyses.filter.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/filter-form-model'),
    modalTitle: _t('components.modals.add-analysis.option-types.filter.title'),
    modalDesc: _t('components.modals.add-analysis.option-types.filter.desc'),
    modalCategory: 'data_transformation'
  },
  'georeference-city': {
    title: _t('analyses.georeference.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/georeference-form-model'),
    checkIfValid: function (userModel, configModel) {
      return checkIfValidByCustomInstall(userModel, configModel);
    }
  },
  'georeference-ip-address': {
    title: _t('analyses.georeference.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/georeference-form-model'),
    checkIfValid: function (userModel, configModel) {
      return checkIfValidByCustomInstall(userModel, configModel);
    }
  },
  'georeference-country': {
    title: _t('analyses.georeference.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/georeference-form-model'),
    checkIfValid: function (userModel, configModel) {
      return checkIfValidByCustomInstall(userModel, configModel);
    }
  },
  'georeference-long-lat': {
    title: _t('analyses.georeference.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/georeference-form-model'),
    modalTitle: _t('components.modals.add-analysis.option-types.georeference.title'),
    modalDesc: _t('components.modals.add-analysis.option-types.georeference.desc'),
    modalCategory: 'create_clean',
    genericType: 'georeference'
  },
  'georeference-postal-code': {
    title: _t('analyses.georeference.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/georeference-form-model'),
    checkIfValid: function (userModel, configModel) {
      return checkIfValidByCustomInstall(userModel, configModel);
    }
  },
  'georeference-street-address': {
    title: _t('analyses.georeference.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/georeference-form-model'),
    checkIfValid: function (userModel, configModel) {
      if (!userModel) throw new Error('userModel is required');
      return userModel.get('geocoder_provider');
    }
  },
  'georeference-admin-region': {
    title: _t('analyses.georeference.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/georeference-form-model'),
    checkIfValid: function (userModel, configModel) {
      return checkIfValidByCustomInstall(userModel, configModel);
    }
  },
  'intersection': {
    title: _t('analyses.filter-intersection.short-title'),
    FormModel: FilterIntersectionFormModel,
    modalTitle: _t('components.modals.add-analysis.option-types.filter-intersection.title'),
    modalDesc: _t('components.modals.add-analysis.option-types.filter-intersection.desc'),
    modalCategory: 'data_transformation'
  },
  'kmeans': {
    title: _t('analyses.kmeans.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/kmeans-form-model'),
    modalTitle: _t('components.modals.add-analysis.option-types.kmeans.title'),
    modalDesc: _t('components.modals.add-analysis.option-types.kmeans.desc'),
    modalCategory: 'analyze_predict'
  },
  'line-to-column': {
    title: _t('analyses.connect-with-lines.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/connect-with-lines-form-model')
  },
  'line-to-single-point': {
    title: _t('analyses.connect-with-lines.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/connect-with-lines-form-model'),
    modalTitle: _t('components.modals.add-analysis.option-types.connect-with-lines.title'),
    modalDesc: _t('components.modals.add-analysis.option-types.connect-with-lines.desc'),
    modalCategory: 'data_transformation'
  },
  'line-source-to-target': {
    title: _t('analyses.connect-with-lines.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/connect-with-lines-form-model')
  },
  'line-sequential': {
    title: _t('analyses.connect-with-lines.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/connect-with-lines-form-model')
  },
  'merge': {
    title: _t('analyses.merge.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/merge-form-model'),
    modalTitle: _t('components.modals.add-analysis.option-types.merge.title'),
    modalDesc: _t('components.modals.add-analysis.option-types.merge.desc'),
    ModalModel: MergeAnalysisOptionModel,
    modalCategory: 'create_clean'
  },
  'moran': {
    title: _t('analyses.moran-cluster.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/moran-form-model'),
    modalTitle: _t('components.modals.add-analysis.option-types.moran-cluster.title'),
    modalDesc: _t('components.modals.add-analysis.option-types.moran-cluster.desc'),
    modalCategory: 'analyze_predict'
  },
  'routing-sequential': {
    checkIfValid: function (userModel, configModel) {
      return checkIfValidByRoutingProvider(userModel, configModel);
    }
  },
  'routing-to-layer-all-to-all': {
    checkIfValid: function (userModel, configModel) {
      return checkIfValidByRoutingProvider(userModel, configModel);
    }
  },
  'routing-to-single-point': {
    checkIfValid: function (userModel, configModel) {
      return checkIfValidByRoutingProvider(userModel, configModel);
    }
  },
  'sampling': {
    title: _t('analyses.sampling.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/sampling-form-model'),
    modalTitle: _t('components.modals.add-analysis.option-types.sampling.title'),
    modalDesc: _t('components.modals.add-analysis.option-types.sampling.desc'),
    modalCategory: 'data_transformation'
  },
  'spatial-markov-trend': {
    title: _t('analyses.spatial-markov-trend.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/spatial-markov-trend-model'),
    modalTitle: _t('components.modals.add-analysis.option-types.spatial-markov-trend.title'),
    modalDesc: _t('components.modals.add-analysis.option-types.spatial-markov-trend.desc'),
    modalCategory: 'analyze_predict'
  },
  'trade-area': {
    title: _t('analyses.area-of-influence.short-title'),
    FormModel: AreaOfInfluenceFormModel,
    checkIfValid: function (userModel, configModel) {
      if (!userModel) throw new Error('userModel is required');
      return !!userModel.get('isolines_provider');
    }
  },
  'weighted-centroid': {
    title: _t('analyses.centroid.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/centroid-form-model')
  }
};

var checkIfValidByCustomInstall = function (userModel, configModel) {
  if (!configModel) throw new Error('configModel is required');
  return configModel.get('cartodb_com_hosted');
};

var checkIfValidByRoutingProvider = function (userModel, configModel) {
  if (!userModel) throw new Error('userModel is required');
  return !!userModel.get('routing_provider');
};

var definitionByType = function (m) {
  var type = 'unknown';

  if (typeof m === 'string' && m !== '') {
    type = m;
  } else if (m && m.get) {
    type = m.get('type');

    if (type === 'data-observatory-measure' && m.has('measurement')) {
      var measurement = m.get('measurement').toLowerCase().split(' ').join('-');

      if (_.contains(DAO_TYPES, measurement)) {
        var measurementType = _.clone(MAP[type]);
        measurementType.title = _t('analyses.data-observatory-measure.' + measurement);
        return measurementType;
      }
    }
  }

  return MAP[type] || {
    title: _t('analyses.' + type),
    FormModel: FallbackFormModel
  };
};

var isAnalysisValidByType = function (type, userModel, configModel) {
  var analysis = MAP[type];
  return analysis && analysis.checkIfValid ? analysis.checkIfValid(userModel, configModel) : true;
};

module.exports = {
  MAP: MAP,

  findFormModelByType: function (type) {
    return camshaftReference.hasType(type)
      ? definitionByType(type).FormModel
      : UnknownTypeFormModel;
  },

  getAnalysesByModalCategory: function (category, userModel, configModel) {
    return _.reduce(MAP, function (memo, item, analysisType) {
      if (item.modalCategory === category) {
        if (isAnalysisValidByType(analysisType, userModel, configModel)) {
          var obj = {
            nodeAttrs: {
              type: analysisType
            },
            title: item.modalTitle,
            desc: item.modalDesc
          };

          if (item.ModalModel) {
            obj.Model = item.ModalModel;
          }

          memo.push(obj);
        }
      }

      return memo;
    }, []);
  },

  isAnalysisValidByType: function (type, userModel, configModel) {
    return isAnalysisValidByType(type, userModel, configModel);
  },

  getAnalysisByType: function (type) {
    return MAP[type];
  },

  title: function (m) {
    return definitionByType(m).title;
  }
};
