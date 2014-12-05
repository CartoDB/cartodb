(function() {

cdb.vis.Overlay.register('logo', function(data, vis) {

});

cdb.vis.Overlay.register('mobile', function(data, vis) {

  var template = cdb.core.Template.compile(
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
    <div class="cartodb-attribution"></div>\
    <a href="#" class="cartodb-attribution-button"></a>\
    <div class="torque"></div>\
    ',
    data.templateType || 'mustache'
  );

  var mobile = new cdb.geo.ui.Mobile({
    template: template,
    mapView: vis.mapView,
    overlays: data.overlays,
    layerView: data.layerView,
    visibility_options: data.options,
    torqueLayer: data.torqueLayer,
    map: data.map
  });

  return mobile.render();
});

cdb.vis.Overlay.register('image', function(data, vis) {

  var options = data.options;

  var template = cdb.core.Template.compile(
    data.template || '\
    <div class="content">\
    <div class="text widget_text">{{{ content }}}</div>\
    </div>',
    data.templateType || 'mustache'
  );

  var widget = new cdb.geo.ui.Image({
    model: new cdb.core.Model(options),
    template: template
  });

  return widget.render();

});

cdb.vis.Overlay.register('text', function(data, vis) {

  var options = data.options;

  var template = cdb.core.Template.compile(
    data.template || '\
    <div class="content">\
    <div class="text widget_text">{{{ text }}}</div>\
    </div>',
    data.templateType || 'mustache'
  );

  var widget = new cdb.geo.ui.Text({
    model: new cdb.core.Model(options),
    template: template,
    className: "cartodb-overlay overlay-text " + options.device
  });

  return widget.render();

});

cdb.vis.Overlay.register('annotation', function(data, vis) {

  var options = data.options;

  var template = cdb.core.Template.compile(
    data.template || '\
    <div class="content">\
    <div class="text widget_text">{{{ text }}}</div>\
    <div class="stick"><div class="ball"></div></div>\
    </div>',
    data.templateType || 'mustache'
  );

  var options = data.options;

  var widget = new cdb.geo.ui.Annotation({
    className: "cartodb-overlay overlay-annotation " + options.device,
    template: template,
    mapView: vis.mapView,
    device: options.device,
    text: options.extra.rendered_text,
    minZoom: options.style["min-zoom"],
    maxZoom: options.style["max-zoom"],
    latlng: options.extra.latlng,
    style: options.style
  });

  return widget.render();

});


cdb.vis.Overlay.register('zoom_info', function(data, vis) {
  //console.log("placeholder for the zoom_info overlay");
});

cdb.vis.Overlay.register('header', function(data, vis) {

  var options = data.options;

  var template = cdb.core.Template.compile(
    data.template || '\
    <div class="content">\
    <div class="title">{{{ title }}}</div>\
    <div class="description">{{{ description }}}</div>\
    </div>',
    data.templateType || 'mustache'
  );

  var widget = new cdb.geo.ui.Header({
    model: new cdb.core.Model(options),
    template: template
  });

  return widget.render();

});

// map zoom control
cdb.vis.Overlay.register('zoom', function(data, vis) {

  if(!data.template) {
    vis.trigger('error', 'zoom template is empty')
    return;
  }

  var zoom = new cdb.geo.ui.Zoom({
    model: data.map,
    template: cdb.core.Template.compile(data.template)
  });

  return zoom.render();

});

// Tiles loader
cdb.vis.Overlay.register('loader', function(data) {

  var tilesLoader = new cdb.geo.ui.TilesLoader({
    template: cdb.core.Template.compile(data.template)
  });

  return tilesLoader.render();
});

cdb.vis.Overlay.register('time_slider', function(data, viz) {
  var slider = new cdb.geo.ui.TimeSlider(data);
  return slider.render();
});


// Header to show informtion (title and description)
cdb.vis.Overlay.register('_header', function(data, vis) {
  var MAX_SHORT_DESCRIPTION_LENGTH = 100;

  // Add the complete url for facebook and twitter
  if (location.href) {
    data.share_url = encodeURIComponent(location.href);
  } else {
    data.share_url = data.url;
  }

  var template = cdb.core.Template.compile(
    data.template || "\
      {{#title}}\
        <h1>\
          {{#url}}\
            <a href='#' onmousedown=\"window.open('{{url}}')\">{{title}}</a>\
          {{/url}}\
          {{^url}}\
            {{title}}\
          {{/url}}\
        </h1>\
      {{/title}}\
      {{#description}}<p>{{{description}}}</p>{{/description}}\
      {{#mobile_shareable}}\
        <div class='social'>\
          <a class='facebook' target='_blank'\
            href='http://www.facebook.com/sharer.php?u={{share_url}}&text=Map of {{title}}: {{description}}'>F</a>\
          <a class='twitter' href='https://twitter.com/share?url={{share_url}}&text={{twitter_title}}'\
           target='_blank'>T</a>\
        </div>\
      {{/mobile_shareable}}\
    ",
    data.templateType || 'mustache'
  );

  function truncate(s, length) {
    return s.substr(0, length-1) + (s.length > length ? '…' : '');
  }

  var title       = data.map.get('title');
  var description = data.map.get('description');

  var facebook_title = title + ": " + description;
  var twitter_title;

  if (title && description) {
    twitter_title = truncate(title + ": " + description, 112) + " %23map "
  } else if (title) {
    twitter_title = truncate(title, 112) + " %23map"
  } else if (description){
    twitter_title = truncate(description, 112) + " %23map"
  } else {
    twitter_title = "%23map"
  }

  var shareable = (data.shareable == "false" || !data.shareable) ? null : data.shareable;
  var mobile_shareable = shareable;

  mobile_shareable = mobile_shareable && (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));

  var header = new cdb.geo.ui.Header({
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
cdb.vis.Overlay.register('infowindow', function(data, vis) {

  if (_.size(data.fields) == 0) {
    return null;
  }

  var infowindowModel = new cdb.geo.ui.InfowindowModel({
    template: data.template,
    alternative_names: data.alternative_names,
    fields: data.fields,
    template_name: data.template_name
  });

  var templateType = data.templateType || 'mustache';

  var infowindow = new cdb.geo.ui.Infowindow({
     model: infowindowModel,
     mapView: vis.mapView,
     template: new cdb.core.Template({ template: data.template, type: templateType}).asFunction()
  });

  return infowindow;
});


// layer_selector
cdb.vis.Overlay.register('layer_selector', function(data, vis) {

  var options = data.options;
  //if (!options.display) return;

  var template = cdb.core.Template.compile(
    data.template || '\
      <a href="#/change-visibility" class="layers">Visible layers<div class="count"></div></a>\
      ',
    data.templateType || 'underscore'
  );

  var dropdown_template = cdb.core.Template.compile(
    data.template || '\
      <ul></ul><div class="tail"><span class="border"></span></div>\
      ',
    data.templateType || 'underscore'
  );

  var layerSelector = new cdb.geo.ui.LayerSelector({
    model: new cdb.core.Model(options),
    mapView: vis.mapView,
    template: template,
    dropdown_template: dropdown_template,
    layer_names: data.layer_names
  });

  if (vis.legends) {

    layerSelector.bind('change:visible', function(visible, order, layer) {

      if (layer.get('type') === 'torque') {

        var timeSlider = vis.getOverlay('time_slider');

        if (timeSlider) {
          timeSlider[visible ? 'show': 'hide']();
        }

      }

      if (layer.get('type') === 'layergroup' || layer.get('type') === 'torque') {

        var legend = vis.legends && vis.legends.getLegendByIndex(order);

        if (legend) {
          legend[visible ? 'show': 'hide']();
        }

      }

    });
  }

  return layerSelector.render();

});

// fullscreen
cdb.vis.Overlay.register('fullscreen', function(data, vis) {

  var options = data.options;

  options.allowWheelOnFullscreen = false;

  var template = cdb.core.Template.compile(
    data.template || '<a href="#"></a>',
    data.templateType || 'mustache'
  );

  var fullscreen = new cdb.ui.common.FullScreen({
    doc: "#map > div",
    model: new cdb.core.Model(options),
    mapView: vis.mapView,
    template: template
  });

  return fullscreen.render();

});

// share content
cdb.vis.Overlay.register('share', function(data, vis) {

  var options = data.options;

  var template = cdb.core.Template.compile(
    data.template || '<a href="#"></a>',
    data.templateType || 'mustache'
  );

  var widget = new cdb.geo.ui.Share({
    model: new cdb.core.Model(options),
    vis: vis,
    map: vis.map,
    template: template
  });

  widget.createDialog();

  return widget.render();

});

// search content
cdb.vis.Overlay.register('search', function(data, vis) {

  var options = data.options;

  //if (!options.display) return;

  var template = cdb.core.Template.compile(
    data.template || '\
      <form>\
        <span class="loader"></span>\
        <input type="text" class="text" value="" />\
        <input type="submit" class="submit" value="" />\
      </form>\
    ',
    data.templateType || 'mustache'
  );

  var search = new cdb.geo.ui.Search({
    template: template,
    model: vis.map
  });

  return search.render();

});

// tooltip
cdb.vis.Overlay.register('tooltip', function(data, vis) {
  var layer;
  if (!data.layer) {
    var layers = vis.getLayers();
    if(layers.length > 1) {
      layer = layers[1];
    }
    data.layer = layer;
  }

  if (!data.layer) {
    throw new Error("layer is null");
  }

  data.layer.setInteraction(true);
  var tooltip = new cdb.geo.ui.Tooltip(data);
  return tooltip;

});

cdb.vis.Overlay.register('infobox', function(data, vis) {
  var layer;
  var layers = vis.getLayers();
  if (!data.layer) {
    if(layers.length > 1) {
      layer = layers[1];
    }
    data.layer = layer;
  }
  if(!data.layer) {
    throw new Error("layer is null");
  }
  data.layer.setInteraction(true);
  var infobox = new cdb.geo.ui.InfoBox(data);
  return infobox;

});

})();
