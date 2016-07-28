var _ = require('underscore');
var camshaftReference = require('./camshaft-reference');
var AreaOfInfluenceFormModel = require('../editor/layers/layer-content-views/analyses/analysis-form-models/area-of-influence-form-model');
var AggregateIntersectionFormModel = require('../editor/layers/layer-content-views/analyses/analysis-form-models/aggregate-intersection-form-model');
var FilterIntersectionFormModel = require('../editor/layers/layer-content-views/analyses/analysis-form-models/filter-intersection-form-model');
var FallbackFormModel = require('../editor/layers/layer-content-views/analyses/analysis-form-models/fallback-form-model');
var UnknownTypeFormModel = require('../editor/layers/layer-content-views/analyses/analysis-form-models/unknown-type-form-model');

var MAP = {
  'aggregate-intersection': {
    title: _t('analyses.aggregate-intersection.short-title'),
    FormModel: AggregateIntersectionFormModel
  },
  'buffer': {
    title: _t('analyses.area-of-influence.short-title'),
    FormModel: AreaOfInfluenceFormModel
  },
  'centroid': {
    title: _t('analyses.centroid.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/centroid-form-model')
  },
  'filter-by-node-column': {
    title: _t('analyses.filter-by-node-column.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/filter-by-node-column')
  },
  'filter-category': {
    title: _t('analyses.filter.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/filter-form-model')
  },
  'filter-range': {
    title: _t('analyses.filter.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/filter-form-model')
  },
  'georeference-city': {
    title: _t('analyses.georeference.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/georeference-form-model')
  },
  'georeference-ip-address': {
    title: _t('analyses.georeference.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/georeference-form-model')
  },
  'georeference-country': {
    title: _t('analyses.georeference.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/georeference-form-model')
  },
  'georeference-long-lat': {
    title: _t('analyses.georeference.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/georeference-form-model')
  },
  'georeference-postal-code': {
    title: _t('analyses.georeference.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/georeference-form-model')
  },
  'georeference-street-address': {
    title: _t('analyses.georeference.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/georeference-form-model')
  },
  'georeference-admin-region': {
    title: _t('analyses.georeference.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/georeference-form-model')
  },
  'intersection': {
    title: _t('analyses.filter-intersection.short-title'),
    FormModel: FilterIntersectionFormModel
  },
  'kmeans': {
    title: _t('analyses.kmeans.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/kmeans-form-model')
  },
  'sampling': {
    title: _t('analyses.sampling.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/sampling-form-model')
  },
  'merge': {
    title: _t('analyses.merge.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/merge-form-model')
  },
  'moran': {
    title: _t('analyses.moran-cluster.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/moran-form-model')
  },
  'trade-area': {
    title: _t('analyses.area-of-influence.short-title'),
    FormModel: AreaOfInfluenceFormModel
  },
  'weighted-centroid': {
    title: _t('analyses.centroid.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/centroid-form-model')
  },
  'spatial-markov-trend': {
    title: _t('analyses.spatial-markov-trend.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/spatial-markov-trend-model')
  },
  'data-observatory-measure': {
    title: _t('analyses.data-observatory-measure.short-title'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/data-observatory-measure-model')
  }
};

var definitionByType = function (type) {
  type = _.isString(type) && type !== '' ? type : 'unknown';
  return MAP[type] || {
    title: _t('analyses.' + type),
    FormModel: FallbackFormModel
  };
};

module.exports = {

  MAP: MAP,

  findFormModelByType: function (type) {
    return camshaftReference.hasType(type)
      ? definitionByType(type).FormModel
      : UnknownTypeFormModel;
  },

  title: function (type) {
    if (type && type.get) {
      type = type.get('type');
    }

    return definitionByType(type).title || type || '';
  }

};
