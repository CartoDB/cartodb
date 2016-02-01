var _ = require('underscore');
var cdb = require('cartodb-deep-insights.js');
var ACTIVE_LOCALE = 'en';
var Polyglot = require('node-polyglot');
var Locale = require('../../locale/index');
var polyglot = new Polyglot({
  locale: ACTIVE_LOCALE, // Needed for pluralize behaviour
  phrases: Locale[ACTIVE_LOCALE]
});
var EditorWidgetModel = require('./editor-widget-model');
var EditorWidgetsCollection = require('./editor-widgets-collection');

cdb.T = polyglot.t.bind(polyglot);

var vizJSON = window.vizJSON;

// Remove old zoom template in order to start using new component
// TODO: decide how to manage this problem
delete vizJSON.overlays[2].template; // Zoom template

// TODO extract datasource info from an assumed existing layergroup,
// this should be included in a v3 of vizjSON
if (!vizJSON.datasource) {
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
      user_name: userName,
      maps_api_template: mapsApiTemplate,
      force_cors: true, // TODO when should this be applied and not?
      stat_tag: statTag
    };
  } else {
    throw new Error('vizJSON v3 should contain a valid datasource to begin with. for the moment we extract the same info from a layergroup. if you read this the viz did not have any layergroup');
  }
}
vizJSON.user = vizJSON.user || {
  fullname: '',
  avatar_url: ''
};
vizJSON.widgets = vizJSON.widgets || [];

window.dashboard = cdb.deepInsights.createDashboard('#dashboard', vizJSON, {
  no_cdn: false,
  cartodb_logo: false,
  renderMenu: false
});

dashboard.vis.done(function (vis, layers) {
  console.info('vis ready!');
})
.error(function (err) {
  console.error(err);
});

var edWidgetsCollection = new EditorWidgetsCollection();
window.model = EditorWidgetModel;
window.collection = edWidgetsCollection;

_.each(vizJSON.widgets, function (edWidgetData) {
  // var idWidgetModel = dashboard.get(edWidgetData.id);
  _.extend(edWidgetData, {
    map_id: '3c1485aa-e1ae-43e2-9dad-c9ea665a0863'
  });
  var edWidgetModel = new EditorWidgetModel(
    edWidgetData, {
      _diWidgetModel: null // idWidgetModel
    }
  );
  edWidgetsCollection.add(edWidgetModel);
});

console.log(edWidgetsCollection);
