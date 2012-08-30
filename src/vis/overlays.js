
// map zoom control
cdb.vis.Overlay.register('zoom', function(data) {

  var zoom = new cdb.geo.ui.Zoom({
    model: data.map,
    el: $('<div>'),
    template: cdb.core.Template.compile(data.template)
  });

  return zoom.render();
});


// header to show informtion (title and description)
cdb.vis.Overlay.register('header', function(data) {

  var template = cdb.core.Template.compile( 
    data.template || "<h1>{{title}}</h1><p>{{description}}</p>",
    'mustache'
  );

  var header = new cdb.geo.ui.Header({
    title: data.map.get('title'),
    description: data.map.get('description'),
    template: template
  });

  return header.render();
});

// infowindow
cdb.vis.Overlay.register('infowindow', function(data, vis) {

  var infowindowModel = new cdb.geo.ui.InfowindowModel({
    fields: data.fields
  });

  var infowindow = new cdb.geo.ui.Infowindow({
     model: infowindowModel,
     mapView: vis.mapView,
     template: new cdb.core.Template({ template: data.template }).asFunction()
  });

  return infowindow;

});
