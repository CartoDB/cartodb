

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

TestUtil.createUser = function(name) {
  var user_data = {"id":2,"username":"staging20","account_type":"FREE","private_tables":true,"table_quota":100,"table_count":2,"byte_quota":314572800,"remaining_table_quota":98,"remaining_byte_quota":313876480,"api_calls":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,73,7074,0,2284,211,384,0,1201,0,93,0,510,293,709],"api_key":"3ee8446970753b2fbdb1df345a2da8a48879ad00","layers":[],"get_layers":true};
  return new cdb.admin.User(user_data);
}

TestUtil.createMap = function() {
  var map = new cdb.admin.Map();
  var mapOpts = {"id":2,"username":"staging20","account_type":"FREE","private_tables":true,"table_quota":100,"table_count":2,"byte_quota":314572800,"remaining_table_quota":98,"remaining_byte_quota":313876480,"api_calls":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,73,7074,0,2284,211,384,0,1201,0,93,0,510,293,709],"api_key":"3ee8446970753b2fbdb1df345a2da8a48879ad00","layers":[],"get_layers":true};
  map.set(map.parse(mapOpts));
  return map;
}

TestUtil.geojsonFeature = JSON.stringify({
      "type": "Feature",
      "properties": { "name": "Coors Field" },
      "geometry": {
          "type": "Point",
          "coordinates": [-104.99404, 39.75621]
      }
});

