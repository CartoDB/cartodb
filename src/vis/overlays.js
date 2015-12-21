var _ = require('underscore');
var Overlay = require('./vis/overlay');
var Model = require('../core/model');
var Template = require('../core/template');
var Mobile = require('../geo/ui/mobile');
var Annotation = require('../geo/ui/annotation');
var Header = require('../geo/ui/header');
var InfoBox = require('../geo/ui/infobox');
var Infowindow = require('../geo/ui/infowindow');
var InfowindowModel = require('../geo/ui/infowindow-model');
var LayerSelector = require('../geo/ui/layer-selector');
var Share = require('../geo/ui/share');
var Search = require('../geo/ui/search/search');
var Text = require('../geo/ui/text');
var TilesLoader = require('../geo/ui/tiles-loader');
var Tooltip = require('../geo/ui/tooltip');
var Zoom = require('../geo/ui/zoom');
var FullScreen = require('../ui/common/fullscreen');
var Attribution = require('../geo/ui/attribution/attribution_view');

Overlay.register('logo', function (data, vis) {});

Overlay.register('attribution', function (data, vis) {
  var overlay = new Attribution({
    map: data.map
  });

  return overlay.render();
});

Overlay.register('mobile', function (data, vis) {
  var template = Template.compile(
    data.template || '\
    <div class="backdrop"></div>\
    <div class="cartodb-header">\
      <div class="content">\
        <a href="#" class="fullscreen"></a>\
        <a href="#" class="toggle"></a>\
        </div>\
      </div>\
    </div>\
    <div class="aside">\
    <div class="layer-container">\
    <div class="scrollpane"><ul class="layers"></ul></div>\
    </div>\
    </div>\
    <div class="torque"></div>\
    ',
    data.templateType || 'mustache'
  );

  var mobile = new Mobile({
    template: template,
    mapView: vis.mapView,
    overlays: data.overlays,
    visualization: vis,
    layerView: data.layerView,
    visibility_options: data.options,
    torqueLayer: data.torqueLayer,
    map: data.map
  });

  return mobile.render();
});

Overlay.register('text', function (data, vis) {
  var options = data.options;

  var template = Template.compile(
    data.template || '\
    <div class="content">\
    <div class="text widget_text">{{{ text }}}</div>\
    </div>',
    data.templateType || 'mustache'
  );

  var widget = new Text({
    model: new Model(options),
    template: template,
    className: 'cartodb-overlay overlay-text ' + options.device
  });

  return widget.render();

});

Overlay.register('annotation', function (data, vis) {
  var options = data.options;

  var template = Template.compile(
    data.template || '\
    <div class="content">\
    <div class="text widget_text">{{{ text }}}</div>\
    <div class="stick"><div class="ball"></div></div>\
    </div>',
    data.templateType || 'mustache'
  );

  var options = data.options;

  var widget = new Annotation({
    className: 'cartodb-overlay overlay-annotation ' + options.device,
    template: template,
    mapView: vis.mapView,
    device: options.device,
    text: options.extra.rendered_text,
    minZoom: options.style['min-zoom'],
    maxZoom: options.style['max-zoom'],
    latlng: options.extra.latlng,
    style: options.style
  });

  return widget.render();

});

Overlay.register('zoom_info', function (data, vis) {
  // console.log("placeholder for the zoom_info overlay");
});

Overlay.register('header', function (data, vis) {
  var options = data.options;

  var template = Template.compile(
    data.template || '\
    <div class="content">\
    <div class="title">{{{ title }}}</div>\
    <div class="description">{{{ description }}}</div>\
    </div>',
    data.templateType || 'mustache'
  );

  var widget = new Header({
    model: new Model(options),
    template: template
  });

  return widget.render();

});

// map zoom control
Overlay.register('zoom', function (data, vis) {
  if (!data.template) {
    vis.trigger('error', 'zoom template is empty');
    return;
  }

  var zoom = new Zoom({
    model: data.map,
    template: Template.compile(data.template)
  });

  return zoom.render();

});

// Tiles loader
Overlay.register('loader', function (data) {
  var tilesLoader = new TilesLoader();
  return tilesLoader.render();
});

// Header to show informtion (title and description)
Overlay.register('_header', function (data, vis) {
  var MAX_SHORT_DESCRIPTION_LENGTH = 100;

  // Add the complete url for facebook and twitter
  if (location.href) {
    data.share_url = encodeURIComponent(location.href);
  } else {
    data.share_url = data.url;
  }

  var template = Template.compile(
    data.template || '\
      {{#title}}\
        <h1>\
          {{#url}}\
            <a href=\'#\' onmousedown="window.open(\'{{url}}\')">{{title}}</a>\
          {{/url}}\
          {{^url}}\
            {{title}}\
          {{/url}}\
        </h1>\
      {{/title}}\
      {{#description}}<p>{{{description}}}</p>{{/description}}\
      {{#mobile_shareable}}\
        <div class=\'social\'>\
          <a class=\'facebook\' target=\'_blank\'\
            href=\'http://www.facebook.com/sharer.php?u={{share_url}}&text=Map of {{title}}: {{description}}\'>F</a>\
          <a class=\'twitter\' href=\'https://twitter.com/share?url={{share_url}}&text={{twitter_title}}\'\
           target=\'_blank\'>T</a>\
        </div>\
      {{/mobile_shareable}}\
    ',
    data.templateType || 'mustache'
  );

  function truncate (s, length) {
    return s.substr(0, length - 1) + (s.length > length ? '…' : '');
  }

  var title = data.map.get('title');
  var description = data.map.get('description');

  var facebook_title = title + ': ' + description;
  var twitter_title;

  if (title && description) {
    twitter_title = truncate(title + ': ' + description, 112) + ' %23map ';
  } else if (title) {
    twitter_title = truncate(title, 112) + ' %23map';
  } else if (description) {
    twitter_title = truncate(description, 112) + ' %23map';
  } else {
    twitter_title = '%23map';
  }

  var shareable = (data.shareable == 'false' || !data.shareable) ? null : data.shareable;
  var mobile_shareable = shareable;

  mobile_shareable = mobile_shareable && (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));

  var header = new Header({
    title: title,
    description: description,
    facebook_title: facebook_title,
    twitter_title: twitter_title,
    url: data.url,
    share_url: data.share_url,
    mobile_shareable: mobile_shareable,
    shareable: shareable && !mobile_shareable,
    template: template
  });

  return header.render();
});

// infowindow
Overlay.register('infowindow', function (data, vis) {
  if (_.size(data.fields) == 0) {
    return null;
  }

  var infowindowModel = new InfowindowModel({
    template: data.template,
    template_type: data.templateType,
    alternative_names: data.alternative_names,
    fields: data.fields,
    template_name: data.template_name,
    template_type: data.template_type
  });

  var infowindow = new Infowindow({
    model: infowindowModel,
    mapView: vis.mapView,
    template: data.template
  });

  return infowindow;
});

// layer_selector
Overlay.register('layer_selector', function (data, vis) {
  var options = data.options;
  // if (!options.display) return;

  var template = Template.compile(
    data.template || '\
      <a href="#/change-visibility" class="layers">Visible layers<div class="count"></div></a>\
      ',
    data.templateType || 'underscore'
  );

  var dropdown_template = Template.compile(
    data.template || '\
      <ul></ul><div class="tail"><span class="border"></span></div>\
      ',
    data.templateType || 'underscore'
  );

  var layerSelector = new LayerSelector({
    model: new Model(options),
    mapView: vis.mapView,
    template: template,
    dropdown_template: dropdown_template,
    layer_names: data.layer_names
  });

  if (vis.legends) {
    layerSelector.bind('change:visible', function (visible, order, layer) {
      if (layer.get('type') === 'layergroup' || layer.get('type') === 'torque') {
        var legend = vis.legends && vis.legends.getLegendByIndex(order);

        if (legend) {
          legend[visible ? 'show' : 'hide']();
        }
      }
    });
  }

  return layerSelector.render();
});

// fullscreen
Overlay.register('fullscreen', function (data, vis) {
  var options = data.options;

  options.allowWheelOnFullscreen = false;

  var template = Template.compile(
    data.template || '<a href="{{ mapUrl }}" target="_blank"></a>',
    data.templateType || 'mustache'
  );

  var fullscreen = new FullScreen({
    doc: '#map > div',
    model: new Model(options),
    mapView: vis.mapView,
    template: template
  });

  return fullscreen.render();

});

// share content
Overlay.register('share', function (data, vis) {
  var options = data.options;

  var template = Template.compile(
    data.template || '<a href="#"></a>',
    data.templateType || 'mustache'
  );

  var widget = new Share({
    model: new Model(options),
    vis: vis,
    map: vis.map,
    template: template
  });

  widget.createDialog();

  return widget.render();

});

// search content
Overlay.register('search', function (data, vis) {
  var opts = _.extend(data, {
    mapView: vis.mapView,
    model: vis.map
  });

  if (data.template) {
    opts.template = Template.compile(data.template, data.templateType || 'mustache');
  }
  var search = new Search(opts);
  return search.render();
});

// tooltip
Overlay.register('tooltip', function (data, vis) {
  if (!data.layer && vis.getLayers().length <= 1) {
    throw new Error('layer is null');
  }
  data.layer = data.layer || vis.getLayers()[1];
  data.layer.setInteraction(true);
  data.mapView = vis.mapView;
  return new Tooltip(data);
});

Overlay.register('infobox', function (data, vis) {
  var layer;
  var layers = vis.getLayers();
  if (!data.layer) {
    if (layers.length > 1) {
      layer = layers[1];
    }
    data.layer = layer;
  }
  if (!data.layer) {
    throw new Error('layer is null');
  }
  data.layer.setInteraction(true);
  var infobox = new InfoBox(data);
  return infobox;

});
