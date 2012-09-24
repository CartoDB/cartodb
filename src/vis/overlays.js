
// map zoom control
cdb.vis.Overlay.register('zoom', function(data) {

  var zoom = new cdb.geo.ui.Zoom({
    model: data.map,
    template: cdb.core.Template.compile(data.template)
  });

  return zoom.render();
});

// Header to show informtion (title and description)
cdb.vis.Overlay.register('header', function(data, vis) {

  var template = cdb.core.Template.compile(
    data.template || "\
      {{#title}}<h1><a href='{{url}}'>{{title}}</a></h1>{{/title}}\
      {{#description}}<p>{{description}}</p>{{/description}}\
      {{#shareable}}<div class='social'><a class='facebook' target='_blank' href='http://www.facebook.com/sharer.php?u={{url}}&text={{title}}'>F</a><a class='twitter' href='https://twitter.com/share?url={{url}}&text={{title}} %7C CartoDB %7C ' target='_blank'>T</a></div>{{/shareable}}\
    ",
    data.templateType || 'mustache'
  );

  var header = new cdb.geo.ui.Header({
    title: data.map.get('title'),
    description: data.map.get('description'),
    url: data.url,
    shareable: (data.shareable == "false" || !data.shareable) ? null : data.shareable,
    template: template
  });

  return header.render();
});

// infowindow
cdb.vis.Overlay.register('infowindow', function(data, vis) {

  var infowindowModel = new cdb.geo.ui.InfowindowModel({
    fields: data.fields
  });

  var templateType = data.templateType || 'mustache'

  var infowindow = new cdb.geo.ui.Infowindow({
     model: infowindowModel,
     mapView: vis.mapView,
     template: new cdb.core.Template({ template: data.template, type: templateType}).asFunction()
  });

  return infowindow;
});


// search content
cdb.vis.Overlay.register('search', function(data, vis) {

  var template = cdb.core.Template.compile(
    data.template || '\
      <form>\
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
