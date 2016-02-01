var _ = require('underscore');
var cdb = require('cartodb-deep-insights.js');
var WidgetDefinitionModel = require('./data-models/widget-definition-model');
var LayerDefinitionModel = require('./data-models/layer-definition-model');
var MapDefinitionModel = require('./data-models/map-definition-model');
var Polyglot = require('node-polyglot');

var ACTIVE_LOCALE = 'en';
var Locale = require('../../locale/index');
var polyglot = new Polyglot({
  locale: ACTIVE_LOCALE, // Needed for pluralize behaviour
  phrases: Locale[ACTIVE_LOCALE]
});

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

var mapDefModel = new MapDefinitionModel({
  id: window.mapId,
  urlRoot: window.userData.base_url
});

var dashboard = cdb.deepInsights.createDashboard('#dashboard', vizJSON, {
  no_cdn: false,
  cartodb_logo: false,
  renderMenu: false
});

// TODO should we provide a dashboard.done of some sort?
dashboard.vis.done(function () {
  // TODO could be encapsulated elsewhere?
  _.each(vizJSON.layers, function (d) {
    if (d.type === 'layergroup') {
      _.each(d.options.layer_definition.layers, function (l) {
        var layerDefModel = new LayerDefinitionModel(l);
        mapDefModel.layers.add(layerDefModel);
      });
    } else {
      var layerDefModel = new LayerDefinitionModel(d);
      mapDefModel.layers.add(layerDefModel);
    }
  });

  _.each(vizJSON.widgets, function (d) {
    var layerDefModel = mapDefModel.layers.get(d.layerId);
    var widgetDefModel = new WidgetDefinitionModel(d, {
      widgetModel: dashboard.widgets.get(d.id),
      layerDefinitionModel: layerDefModel
    });
    mapDefModel.widgets.add(widgetDefModel);
  });
})
.error(function (err) {
  console.error(err);
});

// TODO could we do this better?
mapDefModel.dashboard = dashboard;
window.map = mapDefModel;
