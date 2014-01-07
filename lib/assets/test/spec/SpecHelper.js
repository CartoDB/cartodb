/**
 * Utilities to help the tests
 * @type {Object}
 */
var TestUtil = {};

/**
 * Create a dummy empty table
 * @param  {Strubg} new table name
 * @param  {Array} Schema of the new table
 * @param  {Array} Geometry types, ex: ['ST_Polygon', 'ST_Point'] 
 * @return {cdb.admin.CarotDBTableMetadata}
 */
TestUtil.createTable = function(name, schema, geometry_types) {
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
    geometry_types: geometry_types || ['ST_Polygon'],
    tags: "",
    privacy: "private"
  });
};

/**
 * Create a vis with a name
 * @param  {String} new vis name
 * @return {cdb.admin.Vis} Model
 */
TestUtil.createVis = function(name) {
  return new cdb.admin.Visualization({
    map_id:           96,
    active_layer_id:  null,
    name:             name || "test_vis",
    description:      "Visualization description",
    tags:             [],
    privacy:          "PUBLIC",
    updated_at:       "2013-03-04T18:09:34+01:00",
    type:             "table"
  });
};

/**
 * Reset a table with nElements empty rows
 * @param  {cdb.admin.CartoDBTableMetadata} table
 * @param  {integer} nElements
 */
TestUtil.feedTable = function(table, nElements) {
  if(!nElements) nElements = 1;
  var elements = [];
  for(var i = 0; i < nElements; i++) {
    var element = {};
    var schema = table.get('schema');
    for(var column in schema) {
      element[schema[i][0]] = null;
    }
    element['id'] = i;
    elements.push(element)
  }
  table.data().reset(elements);
}

TestUtil.config = {"tiler_protocol":"","tiler_port":"","tiler_domain":"","ql_api_protocol":"","sql_api_domain":"","sql_api_endpoint":"","sql_api_port":0,"cartodb_com_hosted":false,"account_host":""};

TestUtil.user_data = {
  "id":2,
  "actions":{
    "remove_logo": false,
    "private_tables":true,
    "dedicated_support": false
  },
  "geocoding": {
    "hard_limit": false,
    "block_price": 150,
    "quota": 5000,
    "monthly_use": 1000
  },
  "username":"staging20",
  "account_type":"FREE",
  "table_quota":100,
  "table_count":2,
  "byte_quota":314572800,
  "remaining_table_quota":98,
  "remaining_byte_quota":313876480,
  "api_calls":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,73,7074,0,2284,211,384,0,1201,0,93,0,510,293,709],
  "api_key":"3ee8446970753b2fbdb1df345a2da8a48879ad00",
  "layers":[],
  "get_layers":true
};

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

cdb.config.set({
  sql_api_port: 80,
  sql_api_domain: 'cartodb.com',
  sql_api_endpoint: '/api/v1/sql'
});
