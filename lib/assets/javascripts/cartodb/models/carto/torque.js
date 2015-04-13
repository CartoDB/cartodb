cdb.admin.carto = cdb.admin.carto || {};

cdb.admin.carto.torque = {

  torque_generator: function(table, props, changed, callback) {
    var carto_props = _.omit(props, [
      'property',
      'torque-duration',
      'torque-frame-count',
      'torque-blend-mode',
      'torque-trails',
      'torque-cumulative',
      'torque-resolution',
      'torque-aggregation-function'
    ]);

    var torque_props =
    "Map {\n" +
      [
      '-torque-frame-count:' + props['torque-frame-count'],
      '-torque-animation-duration:' + props['torque-duration'],
      '-torque-time-attribute:"' + props['property'] + '"',
      '-torque-aggregation-function:' + (props['torque-aggregation-function'] ? '"' + props['torque-aggregation-function'] + '"': '"count(cartodb_id)"'),
      '-torque-resolution:' + props['torque-resolution'],
      '-torque-data-aggregation:' + (props['torque-cumulative'] ? 'cumulative': 'linear')
      ].join(';\n') +
    ";\n}";

    if(props['torque-blend-mode']) {
      carto_props['comp-op'] = props['torque-blend-mode'];
    }

    if (carto_props['type'] === 'torque_heat') {
      if(typeof carto_props['marker-opacity'] === 'number'){
        carto_props['marker-opacity'] += "*[value]";
      }
    }

    simple_polygon_generator(table, carto_props, changed, function(css) {
      // add trails
      for (var i = 1; i <= props['torque-trails']; ++i) {
       var trail = "\n#" + table.getUnqualifiedName() + "[frame-offset=" + i  +"] {\n marker-width:" + (props['marker-width'] + 2*i) + ";\n marker-fill-opacity:" + (props['marker-opacity']/(2*i)) +"; \n}";
       css += trail;
      }
      callback(torque_props + "\n\n" + css);
    });
  }

};
