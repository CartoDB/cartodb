/**
 *  Default upload config
 */

module.exports = {
  uploadStates: [
    'pending',
    'enqueued',
    'uploading',
    'unpacking',
    'importing',
    'guessing',
    'complete'
  ],
  fileExtensions: [
    'bz2',
    'csv',
    'gpkg',
    'geojson',
    'gz',
    'json',
    'kml',
    'kmz',
    'gpx',
    'ods',
    'osm',
    'rar',
    'tar',
    'tgz',
    'tif',
    'tiff',
    'tsv',
    'txt',
    'xls',
    'xlsx',
    'zip'
  ],
  // How big should the file be?
  fileTimesBigger: 3
};
