

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

TestUtil.geojsonFeature = JSON.stringify({
      "type": "Feature",
      "properties": { "name": "Coors Field" },
      "geometry": {
          "type": "Point",
          "coordinates": [-104.99404, 39.75621]
      }
});

