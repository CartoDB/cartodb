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
    'csv',
    'xls',
    'xlsx',
    'zip',
    'kml',
    'geojson',
    'json',
    'ods',
    'kmz',
    'tsv',
    'gpx',
    'tar',
    'gz',
    'tgz',
    'osm',
    'bz2',
    'tif',
    'tiff',
    'txt',
    'rar'
  ],
  // How big should the file be?
  fileTimesBigger: 3
};
