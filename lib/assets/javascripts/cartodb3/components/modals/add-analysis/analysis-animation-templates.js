module.exports = {
  'georeference-long-lat': {
    template: require('./animation-templates/georeference.tpl'),
    genericType: 'georeference'
  },
  'data-observatory-measure': {
    template: require('./animation-templates/data-observatory-measure.tpl')
  },
  'merge': {
    template: require('./animation-templates/join-two-columns.tpl')
  },
  'filter-by-node-column': {
    template: require('./animation-templates/filter-by-layer.tpl'),
    params: {
      name_of_the_layer: _t('analyses-onboarding.placeholders.layer-name')
    }
  },
  'centroid': {
    template: require('./animation-templates/centroid.tpl'),
    genericType: 'centroid'
  },
  'convex-hull': {
    template: require('./animation-templates/group-points.tpl'),
    genericType: 'group-points',
    params: {
      method: _t('analyses-onboarding.placeholders.method')
    }
  },
  'buffer': {
    template: require('./animation-templates/aoi.tpl'),
    genericType: 'area-of-influence'
  },
  'aggregate-intersection': {
    template: require('./animation-templates/intersect.tpl')
  },
  'filter-range': {
    template: require('./animation-templates/filter-by-column-value.tpl'),
    genericType: 'filter'
  },
  'sampling': {
    template: require('./animation-templates/sampling.tpl'),
    genericType: 'sampling',
    params: {
      percentage: _t('analyses-onboarding.placeholders.percentage')
    }
  },
  'moran': {
    template: require('./animation-templates/outliers.tpl')
  },
  'spatial-markov-trend': {
    template: require('./animation-templates/predict-trends.tpl')
  },
  'kmeans': {
    template: require('./animation-templates/kmeans.tpl'),
    params: {
      method: _t('analyses-onboarding.placeholders.clusters')
    }
  },
  'line-to-single-point': {
    template: require('./animation-templates/connect-with-lines.tpl')
  },

  'intersection': {
    template: require('./animation-templates/filter-by-polygon.tpl')
  }
};

