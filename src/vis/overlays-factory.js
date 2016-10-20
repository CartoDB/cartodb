var _ = require('underscore');
var Model = require('../core/model');
var Template = require('../core/template');
var Annotation = require('../geo/ui/annotation');
var Header = require('../geo/ui/header');
var LayerSelector = require('../geo/ui/layer-selector');
var Search = require('../geo/ui/search/search');
var Text = require('../geo/ui/text');
var TilesLoader = require('../geo/ui/tiles-loader');
var Zoom = require('../geo/ui/zoom/zoom-view');
var FullScreen = require('../ui/common/fullscreen/fullscreen-view');
var AttributionView = require('../geo/ui/attribution/attribution-view');
var LogoView = require('../geo/ui/logo-view');
var log = require('cdb.log');

/**
 * defines the container for an overlay.
 * It places the overlay
 */
var OverlaysFactory = {

  _types: {},

  // register a type to be created
  register: function (type, creatorFn) {
    OverlaysFactory._types[type] = creatorFn;
  },

  // create a type given the data
  // raise an exception if the type does not exist
  create: function (type, data, deps) {
    deps = deps || {};
    if (!deps.visView) throw new Error('visView is required');
    if (!deps.map) throw new Error('map is required');
    var visView = deps.visView;
    var map = deps.map;

    var t = OverlaysFactory._types[type];

    if (!t) {
      log.error("OverlaysFactory: '" + type + "' does not exist");
      return;
    }

    data.options = typeof data.options === 'string' ? JSON.parse(data.options) : data.options;
    data.options = data.options || {};
    var widget = t(data, visView, map);

    if (widget) {
      widget.type = type;
      return widget;
    }

    return false;
  }
};

OverlaysFactory.register('logo', function (data, visView, map) {
  var overlay = new LogoView();
  return overlay.render();
});

OverlaysFactory.register('attribution', function (data, visView, map) {
  var overlay = new AttributionView({
    map: map
  });

  return overlay.render();
});

OverlaysFactory.register('text', function (data, visView, map) {
  var options = data.options;

  var template = Template.compile(
    data.template || [
      '<div class="content">',
      '<div class="text widget_text">{{{ text }}}</div>',
      '</div>'
    ].join('\n'),
    data.templateType || 'mustache'
  );

  var widget = new Text({
    model: new Model(options),
    template: template,
    className: 'cartodb-overlay overlay-text ' + options.device
  });

  return widget.render();
});

OverlaysFactory.register('annotation', function (data, visView, map) {
  var options = data.options;

  var template = Template.compile(
    data.template || [
      '<div class="content">',
      '<div class="text widget_text">{{{ text }}}</div>',
      '<div class="stick"><div class="ball"></div></div>',
      '</div>'
    ].join('\n'),
    data.templateType || 'mustache'
  );

  var widget = new Annotation({
    className: 'cartodb-overlay overlay-annotation ' + options.device,
    template: template,
    mapView: visView.mapView,
    device: options.device,
    text: options.extra.rendered_text,
    minZoom: options.style['min-zoom'],
    maxZoom: options.style['max-zoom'],
    latlng: options.extra.latlng,
    style: options.style
  });

  return widget.render();
});

OverlaysFactory.register('header', function (data, visView, map) {
  var options = data.options;

  var template = Template.compile(
    data.template || [
      '<div class="content">',
      '<div class="title">{{{ title }}}</div>',
      '<div class="description">{{{ description }}}</div>',
      '</div>'
    ].join('\n'),
    data.templateType || 'mustache'
  );

  var widget = new Header({
    model: new Model(options),
    template: template
  });

  return widget.render();
});

// map zoom control
OverlaysFactory.register('zoom', function (data, visView, map) {
  var opts = {
    model: map
  };

  var zoom = new Zoom(opts);
  return zoom.render();
});

// Tiles loader
OverlaysFactory.register('loader', function (data) {
  var tilesLoader = new TilesLoader();
  return tilesLoader.render();
});

// layer_selector
OverlaysFactory.register('layer_selector', function (data, visView, map) {
  var options = data.options;
  // if (!options.display) return;

  var template = Template.compile(
    data.template || '<a href="#/change-visibility" class="layers">Visible layers<div class="count"></div></a>',
    data.templateType || 'underscore'
  );

  var dropdown_template = Template.compile(
    data.template || '<ul></ul><div class="tail"><span class="border"></span></div>',
    data.templateType || 'underscore'
  );

  var layerSelector = new LayerSelector({
    model: new Model(options),
    mapView: visView.mapView,
    template: template,
    dropdown_template: dropdown_template,
    layer_names: data.layer_names
  });

  if (visView.legends) {
    layerSelector.bind('change:visible', function (visible, order, layer) {
      if (layer.get('type') === 'layergroup' || layer.get('type') === 'torque') {
        var legend = visView.legends && visView.legends.getLegendByIndex(order);

        if (legend) {
          legend[visible ? 'show' : 'hide']();
        }
      }
    });
  }

  return layerSelector.render();
});

// fullscreen
OverlaysFactory.register('fullscreen', function (data, visView, map) {
  var options = _.extend(data, {
    doc: visView.$el.find('> div').get(0),
    allowWheelOnFullscreen: false,
    mapView: visView.mapView
  });

  if (data.template) {
    options.template = Template.compile(
      data.template,
      data.templateType || 'mustache'
    );
  }

  var fullscreen = new FullScreen(options);
  return fullscreen.render();
});

// share content
OverlaysFactory.register('share', function (data, visView, map) {});

// search content
OverlaysFactory.register('search', function (data, visView, map) {
  var opts = _.extend(data, {
    mapView: visView.mapView,
    model: map
  });

  if (data.template) {
    opts.template = Template.compile(data.template, data.templateType || 'mustache');
  }
  var search = new Search(opts);
  return search.render();
});

OverlaysFactory.register('custom', function (data, visView, map) {
  var customOverlayView = data;
  return customOverlayView.render();
});

module.exports = OverlaysFactory;

