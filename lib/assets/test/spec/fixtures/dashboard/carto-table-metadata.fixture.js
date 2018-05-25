const CartoTableMetadata = require('dashboard/views/public-dataset/carto-table-metadata');

module.exports = function (options = {}, configModel) {
  if (!options.schema) {
    options.schema = [
      ['test', 'number'],
      ['test2', 'string']
    ];
  }

  return new CartoTableMetadata({
    id: options.id || options.name || 'test',
    name: options.name || 'test',
    schema: options.schema,
    description: 'test description',
    geometry_types: options.geometry_types || ['ST_Polygon'],
    tags: '',
    privacy: 'private',
    map_id: options.map_id
  }, { configModel });
};
