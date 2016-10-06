module.exports = {
  'georeference-long-lat': {
    template: require('./animation-templates/georeference.tpl'),
    genericType: 'georeference'
  },
  'data-observatory-measure': {
    template: require('./animation-templates/data-observatory-measure.tpl')
  },
  'merge': {
    template: require('./animation-templates/join-two-columns.tpl'),
    genericType: 'join-columns'
  },
  'filter-by-node-column': {
    template: require('./animation-templates/filter-by-layer.tpl'),
    genericType: 'filter-layer'
  },
  'centroid': {
    template: require('./animation-templates/centroid.tpl'),
    genericType: 'centroid'
  },
  'convex-hull': {
    template: require('./animation-templates/group-points.tpl'),
    genericType: 'group-points'
  },
  'buffer': {
    template: require('./animation-templates/aoi.tpl'),
    genericType: 'area-of-influence'
  },
  'aggregate-intersection': {
    template: require('./animation-templates/intersect.tpl'),
    genericType: 'intersect'
  },
  'filter-range': {
    template: require('./animation-templates/filter-by-column-value.tpl'),
    genericType: 'filter'
  },
  'sampling': {
    template: require('./animation-templates/sampling.tpl'),
    genericType: 'sampling'
  },
  'moran': {
    template: require('./animation-templates/outliers.tpl')
  },
  'spatial-markov-trend': {
    template: require('./animation-templates/predict-trends.tpl')
  },
  'kmeans': {
    template: require('./animation-templates/kmeans.tpl')
  },
  'line-to-single-point': {
    template: require('./animation-templates/connect-with-lines.tpl'),
    genericType: 'connect-with-lines'
  },
  'intersection': {
    template: require('./animation-templates/filter-by-polygon.tpl')
  }

  /*,
 'line-to-single-point': {
    template: require('./analyses/connect-with-lines.tpl'),
    genericType: 'connect-with-lines'
  }
   /*,
  'line-to-column': {
    template: require('./analyses/connect-with-lines.tpl'),
    genericType: 'connect-with-lines'
  },
  'line-source-to-target': {
    template: require('./analyses/connect-with-lines.tpl'),
    genericType: 'connect-with-lines'
  },
  'line-sequential': {
    template: require('./analyses/connect-with-lines.tpl'),
    genericType: 'connect-with-lines'
  },
  'bounding-box': {
    template: require('./analyses/group-points.tpl'),
    genericType: 'group-points'
  },
  'bounding-circle': {
    template: require('./analyses/group-points.tpl'),
    genericType: 'group-points'
  },
  'convex-hull': {
    template: require('./analyses/group-points.tpl'),
    genericType: 'group-points'
  },
  'concave-hull': {
    template: require('./analyses/group-points.tpl'),
    genericType: 'group-points'
  },
  'georeference-country': {
    template: require('./analyses/georeference.tpl'),
    genericType: 'georeference'
  },

  'georeference-admin-region': {
    template: require('./analyses/georeference.tpl'),
    genericType: 'georeference'
  },
  'georeference-city': {
    template: require('./analyses/georeference.tpl'),
    genericType: 'georeference'
  },
  'georeference-ip-address': {
    template: require('./analyses/georeference.tpl'),
    genericType: 'georeference'
  },
  'georeference-long-lat': {
    template: require('./analyses/georeference.tpl'),
    genericType: 'georeference'
  },
  'georeference-postal-code': {
    template: require('./analyses/georeference.tpl'),
    genericType: 'georeference'
  },
  'georeference-street-address': {
    template: require('./analyses/georeference.tpl'),
    genericType: 'georeference'
  },
  'data-observatory-measure': {
    template: require('./analyses/data-observatory-measure.tpl'),
    genericType: 'data-observatory-measure'
  },
  'filter-category': {
    template: require('./analyses/filter.tpl'),
    genericType: 'filter'
  },
  'filter-range': {
    template: require('./analyses/filter.tpl'),
    genericType: 'filter'
  },
  'centroid': {
    template: require('./analyses/centroid.tpl')
  },
  'weighted-centroid': {
    template: require('./analyses/centroid.tpl'),
    genericType: 'centroid'
  },
  'merge': {
    template: require('./analyses/merge.tpl')
  },
  'filter-by-node-column': {
    template: require('./analyses/filter-by-node-column.tpl')
  },
  'trade-area': {
    template: require('./analyses/area-of-influence.tpl'),
    genericType: 'area-of-influence'
  },
  'buffer': {
    template: require('./analyses/area-of-influence.tpl'),
    genericType: 'area-of-influence'
  },
  'aggregate-intersection': {
    template: require('./analyses/aggregate-intersection.tpl')
  },
  'intersection': {
    template: require('./analyses/intersection.tpl')
  },
  'sampling': {
    template: require('./analyses/sampling.tpl')
  },
  'kmeans': {
    template: require('./analyses/kmeans.tpl')
  },
  'moran': {
    template: require('./analyses/moran.tpl')
  },
  'spatial-markov-trend': {
    template: require('./analyses/spatial-markov-trend.tpl')
  }
*/

};

