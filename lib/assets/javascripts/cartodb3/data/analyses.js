var _ = require('underscore');
var camshaftReference = require('./camshaft-reference');
var AreaOfInfluenceFormModel = require('../editor/layers/layer-content-views/analyses/analysis-form-models/area-of-influence-form-model');
var AggregateIntersectionFormModel = require('../editor/layers/layer-content-views/analyses/analysis-form-models/aggregate-intersection-form-model');
var FilterIntersectionFormModel = require('../editor/layers/layer-content-views/analyses/analysis-form-models/filter-intersection-form-model');
var FallbackFormModel = require('../editor/layers/layer-content-views/analyses/analysis-form-models/fallback-form-model');
var UnknownTypeFormModel = require('../editor/layers/layer-content-views/analyses/analysis-form-models/unknown-type-form-model');
var MergeAnalysisOptionModel = require('../components/modals/add-analysis/analysis-option-models/merge-analysis-option-model');
var DataServicesApiCheck = require('../editor/layers/layer-content-views/analyses/analyses-quota/analyses-quota-info');

var DAO_TYPES = ['age-and-gender', 'boundaries', 'education', 'employment', 'families', 'housing', 'income', 'language', 'migration', 'nationality', 'population-segments', 'race-and-ethnicity', 'religion', 'transportation'];

var MAP = {
  'aggregate-intersection': {
    title: _t('analyses.aggregate-intersection.short-title'),
    FormModel: AggregateIntersectionFormModel,
    modalTitle: _t('components.modals.add-analysis.option-types.aggregate-intersection.title'),
    modalDesc: _t('components.modals.add-analysis.option-types.aggregate-intersection.desc'),
    modalCategory: 'data_transformation',
    modalLink: 'https://carto.com/learn/guides/analysis/intersect-second-layer',
    onboardingTemplate: require('../components/onboardings/analysis/analyses/aggregate-intersection.tpl'),
    animationTemplate: require('../components/modals/add-analysis/animation-templates/intersect.tpl')
  },
  'bounding-box': {
    title: _t('analyses.bounding-box.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/group-points-form-model'),
    onboardingTemplate: require('../components/onboardings/analysis/analyses/group-points.tpl'),
    genericType: 'group-points'
  },
  'bounding-circle': {
    title: _t('analyses.bounding-circle.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/group-points-form-model'),
    onboardingTemplate: require('../components/onboardings/analysis/analyses/group-points.tpl'),
    genericType: 'group-points'
  },
  'buffer': {
    title: _t('analyses.area-of-influence.short-title'),
    FormModel: AreaOfInfluenceFormModel,
    modalTitle: _t('components.modals.add-analysis.option-types.area-of-influence.title'),
    modalDesc: _t('components.modals.add-analysis.option-types.area-of-influence.desc'),
    modalCategory: 'data_transformation',
    modalLink: 'https://carto.com/learn/guides/analysis/areas-of-influence',
    onboardingTemplate: require('../components/onboardings/analysis/analyses/area-of-influence.tpl'),
    animationTemplate: require('../components/modals/add-analysis/animation-templates/aoi.tpl'),
    genericType: 'area-of-influence'
  },
  'centroid': {
    title: _t('analyses.centroid.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/centroid-form-model'),
    modalTitle: _t('components.modals.add-analysis.option-types.centroid.title'),
    modalDesc: _t('components.modals.add-analysis.option-types.centroid.desc'),
    modalCategory: 'data_transformation',
    modalLink: 'https://carto.com/learn/guides/analysis/find-centroid-of-geometries',
    onboardingTemplate: require('../components/onboardings/analysis/analyses/centroid.tpl'),
    animationTemplate: require('../components/modals/add-analysis/animation-templates/centroid.tpl'),
    genericType: 'centroid'
  },
  'convex-hull': {
    title: _t('analyses.convex-hull.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/group-points-form-model'),
    modalTitle: _t('components.modals.add-analysis.option-types.group-points.title'),
    modalDesc: _t('components.modals.add-analysis.option-types.group-points.desc'),
    modalCategory: 'data_transformation',
    modalLink: 'https://carto.com/learn/guides/analysis/group-points-into-polygons',
    onboardingTemplate: require('../components/onboardings/analysis/analyses//group-points.tpl'),
    animationTemplate: require('../components/modals/add-analysis/animation-templates/group-points.tpl'),
    animationParams: {
      method: _t('analyses-onboarding.placeholders.method')
    },
    genericType: 'group-points'
  },
  'concave-hull': {
    title: _t('analyses.concave-hull.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/group-points-form-model'),
    onboardingTemplate: require('../components/onboardings/analysis/analyses/group-points.tpl'),
    genericType: 'group-points'
  },
  'data-observatory-measure': {
    title: _t('analyses.data-observatory-measure.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/data-observatory-measure-model'),
    modalTitle: _t('components.modals.add-analysis.option-types.data-observatory-measure.title'),
    modalDesc: _t('components.modals.add-analysis.option-types.data-observatory-measure.desc'),
    modalCategory: 'create_clean',
    modalLink: 'https://carto.com/learn/guides/analysis/enrich-from-data-observatory',
    checkIfEnabled: function (configModel) {
      return checkIfDataObservatoryIsEnabled(configModel);
    },
    onboardingTemplate: require('../components/onboardings/analysis/analyses/data-observatory-measure.tpl'),
    animationTemplate: require('../components/modals/add-analysis/animation-templates/data-observatory-measure.tpl'),
    genericType: 'data-observatory-measure'
  },
  'data-observatory-multiple-measures': {
    title: _t('analyses.data-observatory-measure.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/data-observatory-multiple-measure-model'),
    modalTitle: _t('components.modals.add-analysis.option-types.data-observatory-measure.title'),
    modalDesc: _t('components.modals.add-analysis.option-types.data-observatory-measure.desc'),
    modalCategory: 'create_clean',
    modalLink: 'https://carto.com/learn/guides/analysis/enrich-from-data-observatory',
    checkIfEnabled: function (configModel, userModel) {
      var dataservicesApiHealth = DataServicesApiCheck.get(configModel);
      var doApiData = dataservicesApiHealth.getService('observatory');
      var assignedQuota = doApiData ? doApiData.get('monthly_quota') : 0;
      var softLimit = doApiData ? doApiData.get('soft_limit') : false;
      var hideDataObservatory = assignedQuota === 0 && !softLimit;

      return checkIfDataObservatoryIsEnabled(configModel) && !hideDataObservatory;
    },
    onboardingTemplate: require('../components/onboardings/analysis/analyses/data-observatory-multiple-measure.tpl'),
    animationTemplate: require('../components/modals/add-analysis/animation-templates/data-observatory-measure.tpl'),
    genericType: 'data-observatory-multiple-measures'
  },
  'filter-by-node-column': {
    title: _t('analyses.filter-by-node-column.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/filter-by-node-column'),
    modalTitle: _t('components.modals.add-analysis.option-types.filter-by-node-column.title'),
    modalDesc: _t('components.modals.add-analysis.option-types.filter-by-node-column.desc'),
    modalCategory: 'create_clean',
    modalLink: 'https://carto.com/learn/guides/analysis/filter-by-layer',
    onboardingTemplate: require('../components/onboardings/analysis/analyses/filter-by-node-column.tpl'),
    animationTemplate: require('../components/modals/add-analysis/animation-templates/filter-by-layer.tpl'),
    animationParams: {
      name_of_the_layer: _t('analyses-onboarding.placeholders.layer-name')
    }
  },
  'filter-category': {
    title: _t('analyses.filter.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/filter-form-model'),
    onboardingTemplate: require('../components/onboardings/analysis/analyses/filter.tpl'),
    genericType: 'filter'
  },
  'filter-range': {
    title: _t('analyses.filter.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/filter-form-model'),
    modalTitle: _t('components.modals.add-analysis.option-types.filter.title'),
    modalDesc: _t('components.modals.add-analysis.option-types.filter.desc'),
    modalCategory: 'data_transformation',
    modalLink: 'https://carto.com/learn/guides/analysis/filter-by-column-value',
    onboardingTemplate: require('../components/onboardings/analysis/analyses/filter.tpl'),
    animationTemplate: require('../components/modals/add-analysis/animation-templates/filter-by-column-value.tpl'),
    genericType: 'filter'
  },
  'georeference-city': {
    title: _t('analyses.georeference.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/georeference-form-model'),
    checkIfEnabled: function (configModel) {
      return checkIfInternalGeocodingIsEnabled(configModel);
    },
    onboardingTemplate: require('../components/onboardings/analysis/analyses/georeference.tpl'),
    genericType: 'georeference'
  },
  'georeference-ip-address': {
    title: _t('analyses.georeference.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/georeference-form-model'),
    checkIfEnabled: function (configModel) {
      return checkIfInternalGeocodingIsEnabled(configModel);
    },
    onboardingTemplate: require('../components/onboardings/analysis/analyses/georeference.tpl'),
    genericType: 'georeference'
  },
  'georeference-country': {
    title: _t('analyses.georeference.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/georeference-form-model'),
    checkIfEnabled: function (configModel) {
      return checkIfInternalGeocodingIsEnabled(configModel);
    },
    onboardingTemplate: require('../components/onboardings/analysis/analyses/georeference.tpl'),
    genericType: 'georeference'
  },
  'georeference-long-lat': {
    title: _t('analyses.georeference.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/georeference-form-model'),
    onboardingTemplate: require('../components/onboardings/analysis/analyses/georeference.tpl'),
    genericType: 'georeference'
  },
  'georeference-placeholder': {
    dummy: true,
    title: _t('analyses.georeference.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/georeference-form-model'),
    modalTitle: _t('components.modals.add-analysis.option-types.georeference.title'),
    modalDesc: _t('components.modals.add-analysis.option-types.georeference.desc'),
    modalCategory: 'create_clean',
    modalLink: 'https://carto.com/learn/guides/analysis/georeference',
    onboardingTemplate: require('../components/onboardings/analysis/analyses/georeference.tpl'),
    animationTemplate: require('../components/modals/add-analysis/animation-templates/georeference.tpl'),
    genericType: 'georeference'
  },
  'georeference-postal-code': {
    title: _t('analyses.georeference.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/georeference-form-model'),
    checkIfEnabled: function (configModel) {
      return checkIfInternalGeocodingIsEnabled(configModel);
    },
    onboardingTemplate: require('../components/onboardings/analysis/analyses/georeference.tpl'),
    genericType: 'georeference'
  },
  'georeference-street-address': {
    title: _t('analyses.georeference.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/georeference-form-model'),
    checkIfEnabled: function (configModel) {
      return checkIfExternalGeocodingIsEnabled(configModel);
    },
    onboardingTemplate: require('../components/onboardings/analysis/analyses/georeference.tpl'),
    genericType: 'georeference'
  },
  'georeference-admin-region': {
    title: _t('analyses.georeference.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/georeference-form-model'),
    checkIfEnabled: function (configModel) {
      return checkIfInternalGeocodingIsEnabled(configModel);
    },
    onboardingTemplate: require('../components/onboardings/analysis/analyses/georeference.tpl'),
    genericType: 'georeference'
  },
  'intersection': {
    title: _t('analyses.filter-intersection.short-title'),
    FormModel: FilterIntersectionFormModel,
    modalTitle: _t('components.modals.add-analysis.option-types.filter-intersection.title'),
    modalDesc: _t('components.modals.add-analysis.option-types.filter-intersection.desc'),
    modalCategory: 'data_transformation',
    modalLink: 'https://carto.com/learn/guides/analysis/filter-points-in-polygons',
    onboardingTemplate: require('../components/onboardings/analysis/analyses/intersection.tpl'),
    animationTemplate: require('../components/modals/add-analysis/animation-templates/filter-by-polygon.tpl')
  },
  'kmeans': {
    title: _t('analyses.kmeans.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/kmeans-form-model'),
    modalTitle: _t('components.modals.add-analysis.option-types.kmeans.title'),
    modalDesc: _t('components.modals.add-analysis.option-types.kmeans.desc'),
    modalCategory: 'analyze_predict',
    modalLink: 'https://carto.com/learn/guides/analysis/calculate-clusters-of-points',
    onboardingTemplate: require('../components/onboardings/analysis/analyses/kmeans.tpl'),
    animationTemplate: require('../components/modals/add-analysis/animation-templates/kmeans.tpl'),
    animationParams: {
      method: _t('analyses-onboarding.placeholders.clusters')
    }
  },
  'line-to-single-point': {
    title: _t('analyses.connect-with-lines.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/connect-with-lines-form-model'),
    modalTitle: _t('components.modals.add-analysis.option-types.connect-with-lines.title'),
    modalDesc: _t('components.modals.add-analysis.option-types.connect-with-lines.desc'),
    modalCategory: 'data_transformation',
    modalLink: 'https://carto.com/learn/guides/analysis/connect-with-lines',
    onboardingTemplate: require('../components/onboardings/analysis/analyses/connect-with-lines.tpl'),
    animationTemplate: require('../components/modals/add-analysis/animation-templates/connect-with-lines.tpl'),
    genericType: 'connect-with-lines'
  },
  'line-source-to-target': {
    title: _t('analyses.connect-with-lines.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/connect-with-lines-form-model'),
    onboardingTemplate: require('../components/onboardings/analysis/analyses/connect-with-lines.tpl'),
    animationTemplate: require('../components/modals/add-analysis/animation-templates/connect-with-lines.tpl'),
    genericType: 'connect-with-lines'
  },
  'line-sequential': {
    title: _t('analyses.connect-with-lines.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/connect-with-lines-form-model'),
    onboardingTemplate: require('../components/onboardings/analysis/analyses/connect-with-lines.tpl'),
    animationTemplate: require('../components/modals/add-analysis/animation-templates/connect-with-lines.tpl'),
    genericType: 'connect-with-lines'
  },
  'merge': {
    title: _t('analyses.merge.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/merge-form-model'),
    modalTitle: _t('components.modals.add-analysis.option-types.merge.title'),
    modalDesc: _t('components.modals.add-analysis.option-types.merge.desc'),
    ModalModel: MergeAnalysisOptionModel,
    modalCategory: 'create_clean',
    modalLink: 'https://carto.com/learn/guides/analysis/join-column-from-second-layer',
    onboardingTemplate: require('../components/onboardings/analysis/analyses/merge.tpl'),
    animationTemplate: require('../components/modals/add-analysis/animation-templates/join-two-columns.tpl')
  },
  'moran': {
    title: _t('analyses.moran-cluster.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/moran-form-model'),
    modalTitle: _t('components.modals.add-analysis.option-types.moran-cluster.title'),
    modalDesc: _t('components.modals.add-analysis.option-types.moran-cluster.desc'),
    modalCategory: 'analyze_predict',
    modalLink: 'https://carto.com/learn/guides/analysis/detect-outliers-and-clusters',
    onboardingTemplate: require('../components/onboardings/analysis/analyses/moran.tpl'),
    animationTemplate: require('../components/modals/add-analysis/animation-templates/outliers.tpl')
  },
  'routing-sequential': {
    title: _t('analyses.routing.short-title'),
    FormModel: FallbackFormModel,
    checkIfEnabled: function (configModel) {
      return checkIfRoutingIsEnabled(configModel);
    }
  },
  'routing-to-layer-all-to-all': {
    title: _t('analyses.routing.short-title'),
    FormModel: FallbackFormModel,
    checkIfEnabled: function (configModel) {
      return checkIfRoutingIsEnabled(configModel);
    }
  },
  'routing-to-single-point': {
    title: _t('analyses.routing.short-title'),
    FormModel: FallbackFormModel,
    checkIfEnabled: function (configModel) {
      return checkIfRoutingIsEnabled(configModel);
    }
  },
  'sampling': {
    title: _t('analyses.sampling.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/sampling-form-model'),
    modalTitle: _t('components.modals.add-analysis.option-types.sampling.title'),
    modalDesc: _t('components.modals.add-analysis.option-types.sampling.desc'),
    modalCategory: 'data_transformation',
    modalLink: 'https://carto.com/learn/guides/analysis/subsample-percent-of-rows',
    onboardingTemplate: require('../components/onboardings/analysis/analyses/sampling.tpl'),
    animationTemplate: require('../components/modals/add-analysis/animation-templates/sampling.tpl'),
    animationParams: {
      percentage: _t('analyses-onboarding.placeholders.percentage')
    },
    genericType: 'sampling'
  },
  'spatial-markov-trend': {
    title: _t('analyses.spatial-markov-trend.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/spatial-markov-trend-model'),
    modalTitle: _t('components.modals.add-analysis.option-types.spatial-markov-trend.title'),
    modalDesc: _t('components.modals.add-analysis.option-types.spatial-markov-trend.desc'),
    modalCategory: 'analyze_predict',
    modalLink: 'https://carto.com/learn/guides/analysis/predict-trends-and-volatility',
    onboardingTemplate: require('../components/onboardings/analysis/analyses/spatial-markov-trend.tpl'),
    animationTemplate: require('../components/modals/add-analysis/animation-templates/predict-trends.tpl')
  },
  'trade-area': {
    title: _t('analyses.area-of-influence.short-title'),
    FormModel: AreaOfInfluenceFormModel,
    checkIfEnabled: function (configModel) {
      if (!configModel) throw new Error('configModel is required');
      return !!configModel.dataServiceEnabled('isolines');
    },
    onboardingTemplate: require('../components/onboardings/analysis/analyses/area-of-influence.tpl'),
    genericType: 'area-of-influence'
  },
  'weighted-centroid': {
    title: _t('analyses.centroid.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/centroid-form-model'),
    onboardingTemplate: require('../components/onboardings/analysis/analyses/centroid.tpl'),
    genericType: 'centroid'
  },
  'closest': {
    title: _t('editor.layers.analysis-form.find-nearest.title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/closest-form-model'),
    modalTitle: _t('editor.layers.analysis-form.find-nearest.modal-title'),
    modalDesc: _t('editor.layers.analysis-form.find-nearest.modal-desc'),
    modalCategory: 'analyze_predict',
    modalLink: 'https://carto.com/learn/guides/analysis/find-nearest',
    animationTemplate: require('../components/modals/add-analysis/animation-templates/closest.tpl'),
    onboardingTemplate: require('../components/onboardings/analysis/analyses/closest.tpl')
  },
  'deprecated-sql-function': {
    title: _t('editor.layers.analysis-form.deprecated-sql-function.title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/deprecated-sql-function-form-model'),
    modalTitle: _t('components.modals.add-analysis.option-types.deprecated-sql-function.title'),
    modalDesc: _t('components.modals.add-analysis.option-types.deprecated-sql-function.desc'),
    modalCategory: 'data_transformation',
    checkIfEnabled: function (configModel, userModel) {
      return userModel.featureEnabled('deprecated-sql-function');
    }
  }
};

var checkIfInternalGeocodingIsEnabled = function (configModel) {
  if (!configModel) throw new Error('configModel is required');
  return isDataServicesReady(configModel) && !!configModel.dataServiceEnabled('geocoder_internal');
};

var checkIfRoutingIsEnabled = function (configModel) {
  if (!configModel) throw new Error('configModel is required');
  return isDataServicesReady(configModel) && !!configModel.dataServiceEnabled('routing');
};

var checkIfExternalGeocodingIsEnabled = function (configModel) {
  if (!configModel) throw new Error('configModel is required');
  return isDataServicesReady(configModel) && !!configModel.dataServiceEnabled('hires_geocoder');
};

var checkIfDataObservatoryIsEnabled = function (configModel) {
  if (!configModel) throw new Error('configModel is required');
  return isDataServicesReady(configModel) && !!configModel.dataServiceEnabled('data_observatory');
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
    modalLink: '',
    FormModel: FallbackFormModel
  };
};

var isDataServicesReady = function (configModel) {
  return DataServicesApiCheck.get(configModel).isReady();
};

var isAnalysisValidByType = function (type, configModel, userModel) {
  var analysis = MAP[type];
  return analysis && analysis.checkIfEnabled ? analysis.checkIfEnabled(configModel, userModel) : true;
};

var DATA_OBSERVATORY_OLD = 'data-observatory-measure';

module.exports = {
  MAP: MAP,

  findFormModelByType: function (type) {
    var isDummy = MAP[type] && MAP[type].dummy;
    return camshaftReference.hasType(type) || isDummy
      ? definitionByType(type).FormModel
      : UnknownTypeFormModel;
  },

  getAnalysesByModalCategory: function (category, configModel, userModel) {
    return _.reduce(MAP, function (memo, item, analysisType) {
      if (analysisType === DATA_OBSERVATORY_OLD) {
        return memo;
      }

      if (item.modalCategory === category) {
        if (isAnalysisValidByType(analysisType, configModel, userModel)) {
          var obj = {
            nodeAttrs: {
              type: analysisType
            },
            title: item.modalTitle,
            desc: item.modalDesc,
            link: item.modalLink
          };

          if (item.ModalModel) {
            obj.Model = item.ModalModel;
          }

          if (item.dummy) {
            obj.dummy = item.dummy;
          }

          memo.push(obj);
        }
      }

      return memo;
    }, []);
  },

  isAnalysisValidByType: function (type, configModel, userModel) {
    return isAnalysisValidByType(type, configModel, userModel);
  },

  getAnalysisByType: function (type) {
    return MAP[type];
  },

  title: function (model) {
    return definitionByType(model).title;
  },

  link: function (model) {
    return definitionByType(model).modalLink;
  }
};
