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
TestUtil.createTable = function(name, schema, geometry_types, map_id) {
  if(!schema) {
    schema = [
      ['test', 'number'],
      ['test2', 'string']
    ]
  }
  return new cdb.admin.CartoDBTableMetadata({
    id: name || 'test',
    name: name || 'test',
    schema: schema,
    description: 'test description',
    geometry_types: geometry_types || ['ST_Polygon'],
    tags: "",
    privacy: "private",
    map_id: map_id
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
  // set up query_schema so the table schema will be filled with that data
  table.data().query_schema = table._columnType;
  table.data().reset(elements);
}

TestUtil.config = {
  sql_api_template: "http://{user}.localhost.lan",
  maps_api_template: "",
  "cartodb_com_hosted":false,
  "account_host":"",
  "user_name": "test",
  default_fallback_basemap: {
    urlTemplate: 'http://basemap.com/{z}/{x}/{y}.png'
  }

};

TestUtil.user_data = {
  "id":2,
  "actions":{
    "remove_logo": false,
    "private_tables":true
  },
  "limits": {
    "concurrent_imports": 3
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
  "quota_in_bytes":314572800,
  "remaining_table_quota":98,
  "remaining_byte_quota":313876480,
  "api_calls":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,73,7074,0,2284,211,384,0,1201,0,93,0,510,293,709],
  "api_key":"3ee8446970753b2fbdb1df345a2da8a48879ad00",
  "layers":[],
  "get_layers":true,
  "twitter": { "enabled": true },
  "mailchimp": { "enabled": false }
};

TestUtil.createUser = function() {
  return new cdb.admin.User(this.user_data);
}

TestUtil.map_data = {"id":2,"username":"staging20","account_type":"FREE","private_tables":true,"table_quota":100,"table_count":2,"quota_in_bytes":314572800,"remaining_table_quota":98,"remaining_byte_quota":313876480,"api_calls":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,73,7074,0,2284,211,384,0,1201,0,93,0,510,293,709],"api_key":"3ee8446970753b2fbdb1df345a2da8a48879ad00","layers":[],"get_layers":true};

TestUtil.map_config = {
  "updated_at": 'cachebuster',
  "title": "irrelevant",
  "url": "https://carto.com",
  "center": "[40.044, -101.95]",
  "bounding_box_sw": "[20, -140]",
  "bounding_box_ne": "[ 55, -50]",
  "zoom": "4",
  "view_bounds_ne": "[1, 2]",
  "view_bounds_sw": "[3, 4]"
};

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

TestUtil.linkedObjects = function(view) {

  function flatten_views(view) {
    var flatten = [];
    var sub = view._subviews;
    flatten.push(view);
    for(var k in sub) {
      var v = sub[k];
      flatten.push(v);
      flatten= flatten.concat(flatten_views(v));
    }
    return flatten;
  }
  var views = flatten_views(view);
  view.clean();

  function evented_objects(obj) {
    var ev = [];
    for(var k in obj) {
      var o = obj[k];
      if( k !== '_parent' && o && obj.hasOwnProperty(k) && o._callbacks ) {
        ev.push(o);
      }
    }
    return ev;
  }

  function callback_context(o) {
    var c = [];
    var callbacks = o._callbacks;
    for(var i in callbacks) {
      var node = callbacks[i];
      var end = node.tail;
      while ((node = node.next) !== end) {
        if (node.context) {
          c.push(node.context.cid);
        }
      }
    }
    return c;
  }

  function already_linked() {
    var linked = [];
    // check no pending callbacks
    for (var k in views) {
      var v = views[k];
      var objs = evented_objects(v);
      for(var o in objs) {
        if (_.include(callback_context(objs[o]), v.cid)) {
          linked.push(v);
        }
      }
    }
    return linked;
  }

  return already_linked();


};

TestUtil.assertNotLeaks = function(view) {
  expect(TestUtil.linkedObjects(view).length).toEqual(0);
};


TestUtil._view = function(v) {
  // 1) name of view property in "this" context, e.g. "foobarView"
  // 2) view object as param, e.g. foobarView
  // 3) this.view defined in a beforeEach
  return this[v] || v || this.view;
};

beforeEach(function() {
  cdb.config.attributes = {};
  cdb.config.set(TestUtil.config);
  jasmine.addMatchers({
    toHaveNoLeaks: function() {
      if (arguments.length > 0) {
        //throw new Error('toHaveNoLeaks not take arguments, use toHaveBeenCalledWith');
      }

      return {
        compare: function(actual, expected) {
          var linked = TestUtil.linkedObjects(actual);
          if (linked.length) {
            console.log("** linked objects")
            for(var i in linked) {
              console.log(linked[i]);
            }
          }
          var result = {};
          result.pass = linked.length === 0;
          result.message = "Expected objects not linked (" + linked.length + "), check the console"
          return result;
        }
      }
    }
  });

  this.innerHTML = function(v) {
    return TestUtil._view.call(this, v).el.innerHTML;
  };

  this.$html = function(v) {
    return TestUtil._view.call(this, v).$el.html();
  };
});

afterEach(function() {
  // Clean up any element that was injected in test results, expect for Jasmine's HTML reporter.
  $('body > div:not(.jasmine_html-reporter)').remove();
});
