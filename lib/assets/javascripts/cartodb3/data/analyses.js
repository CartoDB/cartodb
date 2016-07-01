var _ = require('underscore');
var camshaftReference = require('./camshaft-reference');
var AreaOfInfluenceFormModel = require('../editor/layers/layer-content-views/analyses/analysis-form-models/area-of-influence-form-model');
var IntersectionFormModel = require('../editor/layers/layer-content-views/analyses/analysis-form-models/intersection-form-model');
var FallbackFormModel = require('../editor/layers/layer-content-views/analyses/analysis-form-models/fallback-form-model');
var UnknownTypeFormModel = require('../editor/layers/layer-content-views/analyses/analysis-form-models/unknown-type-form-model');

var MAP = {
  'aggregate-intersection': {
    title: _t('analyses.aggregate-intersection'),
    FormModel: IntersectionFormModel
  },
  'buffer': {
    title: _t('analyses.area-of-influence'),
    FormModel: AreaOfInfluenceFormModel
  },
  'centroid': {
    title: _t('analyses.centroid'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/centroid-form-model')
  },
  'filter-by-node-column': {
    title: _t('analyses.filter-by-node-column'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/filter-by-node-column')
  },
  'filter-category': {
    title: _t('analyses.filter'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/filter-form-model')
  },
  'filter-range': {
    title: _t('analyses.filter'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/filter-form-model')
  },
  'georeference-city': {
    title: _t('analyses.georeference'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/georeference-form-model')
  },
  'georeference-ip-address': {
    title: _t('analyses.georeference'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/georeference-form-model')
  },
  'georeference-long-lat': {
    title: _t('analyses.georeference'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/georeference-form-model')
  },
  'georeference-postal-code': {
    title: _t('analyses.georeference'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/georeference-form-model')
  },
  'georeference-street-address': {
    title: _t('analyses.georeference'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/georeference-form-model')
  },
  'georeference-admin-region': {
    title: _t('analyses.georeference'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/georeference-form-model')
  },
  'intersection': {
    title: _t('analyses.intersection'),
    FormModel: IntersectionFormModel
  },
  'kmeans': {
    title: _t('analyses.cluster'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/kmeans-form-model')
  },
  'moran': {
    title: _t('analyses.cluster'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/moran-form-model')
  },
  // 'point-in-polygon': {
  //   title: _t('analyses.point-in-polygon'),
  //   FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/point-in-polygon-form-model')
  // },
  'trade-area': {
    title: _t('analyses.area-of-influence'),
    FormModel: AreaOfInfluenceFormModel
  },
  'weighted-centroid': {
    title: _t('analyses.centroid'),
    FormModel: require('../editor/layers/layer-content-views/analyses/analysis-form-models/centroid-form-model')
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
