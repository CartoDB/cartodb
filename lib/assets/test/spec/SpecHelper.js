

var TestUtil = {};

TestUtil.createTable = function(name, schema) {
  if(!schema) {
    schema = [
      ['test', 'number'],
      ['test2', 'string']
    ]
  }
  return new cdb.admin.CartoDBTableMetadata({
    name: name || 'test',
    schema: schema,
    description: 'test description',
    geometry_types: ['ST_Polygon'],
    tags: "",
    privacy: "private"
  });
};
TestUtil.config = {"tiler_protocol":"","tiler_port":"","tiler_domain":"","ql_api_protocol":"","sql_api_domain":"","sql_api_endpoint":"","sql_api_port":0,"cartodb_com_hosted":false,"account_host":""};
TestUtil.user_data = {"id":2,"username":"staging20","account_type":"FREE","private_tables":true,"table_quota":100,"table_count":2,"byte_quota":314572800,"remaining_table_quota":98,"remaining_byte_quota":313876480,"api_calls":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,73,7074,0,2284,211,384,0,1201,0,93,0,510,293,709],"api_key":"3ee8446970753b2fbdb1df345a2da8a48879ad00","layers":[],"get_layers":true};
TestUtil.createUser = function(name) {
  return new cdb.admin.User(this.user_data);
}
TestUtil.map_data = {"id":2,"username":"staging20","account_type":"FREE","private_tables":true,"table_quota":100,"table_count":2,"byte_quota":314572800,"remaining_table_quota":98,"remaining_byte_quota":313876480,"api_calls":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,73,7074,0,2284,211,384,0,1201,0,93,0,510,293,709],"api_key":"3ee8446970753b2fbdb1df345a2da8a48879ad00","layers":[],"get_layers":true};
TestUtil.createMap = function() {
  var map = new cdb.admin.Map();
  map.set(map.parse(this.map_data));
  return map;
}
TestUtil.response = function(json, code) {
  if(!code) code = 200
  return [code, { "Content-Type": "application/json" }, json]
}

TestUtil.geojsonFeature = JSON.stringify({
      "type": "Feature",
      "properties": { "name": "Coors Field" },
      "geometry": {
          "type": "Point",
          "coordinates": [-104.99404, 39.75621]
      }
});

