module.exports = {
  'moran': require('./analyses/moran'),
  'data-observatory-measure': require('./analyses/data-observatory-measure'),
  'centroid': require('./analyses/centroid'),
  'weighted-centroid': require('./analyses/centroid'),
  'georeference-country': require('./analyses/georeference'),
  'georeference-admin-region': require('./analyses/georeference'),
  'georeference-city': require('./analyses/georeference'),
  'georeference-ip-address': require('./analyses/georeference'),
  'georeference-long-lat': require('./analyses/georeference'),
  'georeference-postal-code': require('./analyses/georeference'),
  'georeference-street-address': require('./analyses/georeference')
};
