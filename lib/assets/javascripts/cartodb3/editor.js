var $ = require('jquery');
var _ = require('underscore');
var cdb = require('cartodb-deep-insights.js');
var Polyglot = require('node-polyglot');
var Locale = require('../../locale/index');
var ACTIVE_LOCALE = 'en';
var EditorTemplate = require('./editor.tpl'); // TODO: remove it

window.polyglot = new Polyglot({
  phrases: Locale[ACTIVE_LOCALE]
});

// TODO: delete it (HA!)
$('body').prepend(EditorTemplate());

var vizJSON = window.vizJSON;

// TODO extract datsource info from an assumed existing layergroup,
// this should be included in a v3 of vizjSON
var userName;
var mapsApiTemplate;
var statTag;
_.each(vizJSON.layers, function (layer) {
  if (layer.type === 'layergroup') {
    var o = layer.options;
    userName = o.user_name;
    mapsApiTemplate = o.maps_api_template;
    statTag = o.layer_definition.stat_tag;
  }
});

if (userName) {
  vizJSON.datasource = {
    type: 'public_map',
    user_name: userName,
    maps_api_template: mapsApiTemplate,
    force_cors: true, // TODO when should this be applied and not?
    stat_tag: statTag
  };
} else {
  throw new Error('vizJSON v3 should contain a valid datasource to begin with. for the moment we extract the same info from a layergroup. if you read this the viz did not have any layergroup');
}

var diJSON = {
  title: '',
  description: '',
  user: {
    fullname: '',
    avatar_url: ''
  },
  updated_at: '2015-10-26T11:50:30+00:00',
  widgets: [],
  vizJSON: vizJSON
};

var visOpts = {
  no_cdn: false,
  cartodb_logo: false
};
cdb.deepInsights.createDashboard('#dashboard', diJSON, visOpts)
  .vis.done(function (vis, layers) {
    console.info('vis ready!');
  })
  .error(function (err) {
    console.error(err);
  });
