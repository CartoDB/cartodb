

var TestUtil = {};

TestUtil.createTable = function(name) {
  return new cdb.admin.CartoDBTableMetadata({ 
    name: name || 'test',
    schema: [
      ['test', 'number'],
      ['test2', 'string']
    ],
    description: 'test description',
    geometry_types: ['ST_Polygon']
  });
};
