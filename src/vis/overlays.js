
(function() {

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

// Header to show informtion (title and description)
cdb.vis.Overlay.register('header', function(data, vis) {
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
      {{#description}}<p>{{description}}</p>{{/description}}\
      {{#shareable}}\
        <div class='social'>\
          <a class='facebook' target='_blank'\
            href='http://www.facebook.com/sharer.php?u={{share_url}}&text=Map of {{title}}: {{description}}'>F</a>\
          <a class='twitter' href='https://twitter.com/share?url={{share_url}}&text=Map of {{title}}: {{descriptionShort}}... '\
           target='_blank'>T</a>\
        </div>\
      {{/shareable}}\
    ",
    data.templateType || 'mustache'
  );

  var titleLength = data.map.get('title') ? data.map.get('title').length : 0;
  var descLength = data.map.get('description') ? data.map.get('description').length : 0;

  var maxDescriptionLength = MAX_SHORT_DESCRIPTION_LENGTH - titleLength;
  var description = data.map.get('description');
  var descriptionShort = description;

  if(descLength > maxDescriptionLength) {
    var descriptionShort = description.substr(0, maxDescriptionLength);
    // @todo (@johnhackworth): Improvement; Not sure if there's someway of doing thins with a regexp
    descriptionShort = descriptionShort.split(' ');
    descriptionShort.pop();
    descriptionShort = descriptionShort.join(' ');
  }

  var header = new cdb.geo.ui.Header({
    title: data.map.get('title'),
    description: description,
    descriptionShort: descriptionShort,
    url: data.url,
    share_url: data.share_url,
    shareable: (data.shareable == "false" || !data.shareable) ? null : data.shareable,
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
    mapView: vis.mapView,
    template: template,
    dropdown_template: dropdown_template,
    layer_names: data.layer_names
  });

  if(vis.legends) {
    layerSelector.bind('change:visible', function(visible, order) {
      //var o = vis.legends.options.legends.length - order - 1;
      var legend = vis.legends && vis.legends.getLayerByIndex(order);

      if(legend) {
        legend[visible ? 'show': 'hide']();
      }

    });
  }


  return layerSelector.render();
});

// search content
cdb.vis.Overlay.register('search', function(data, vis) {

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
  var layers = vis.getLayers();
  if(layers.length > 1) {
    layer = layers[1];
  }
  data.layer = layer;
  var tooltip = new cdb.geo.ui.Tooltip(data);
  return tooltip;

});

cdb.vis.Overlay.register('infobox', function(data, vis) {
  var layer;
  var layers = vis.getLayers();
  if(layers.length > 1) {
    layer = layers[1];
  }
  data.layer = layer;
  var infobox = new cdb.geo.ui.InfoBox(data);
  return infobox;

});

})();
