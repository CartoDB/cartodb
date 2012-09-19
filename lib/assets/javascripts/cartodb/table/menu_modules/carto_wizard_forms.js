
(function() {

cdb.admin.forms = {};

var polygon_stroke = {
   name: 'Polygon Stroke',
   form: {
      'line-width': { type: 'width', value: 1 },
      'line-color': { type: 'color' , value: '#FFF' },
      'line-opacity': { type: 'opacity', value: 0.8 }
  }
};

var line_stroke = {
   name: 'LineStroke',
   form: polygon_stroke.form
};

var polygon_fill = {
   name: 'Polygon Fill',
   form: {
      'polygon-fill': { type: 'color' , value: '#FF5C00' },
      'polygon-opacity': { type: 'opacity' , value: 0.8 }
  }
};

var label_text = {
     name: 'Label Text',
     form: { 
      'text-name': { type: 'select' }  /* value is filled by wizard */
     }
};

var label_text_properties = {
    name: 'Label Font',
    form: {
      'text-face-name': {
        type: 'select',
        value: "DejaVu Sans Book",
        extra: ["DejaVu Sans Book","unifont Medium"]
      },
      'text-size': { type: 'number', value: 10, min: 1 },
      'text-fill': { type: 'color' , value: '#000' }
    }
};

var label_halo_properties = {
  name: 'Label Halo',
  form: {
    'text-halo-fill':  { type: 'color' , value: '#FFF' },
    'text-halo-radius': { type: 'number', value: 1, min: 0}
  }
};

var marker_fill = {
       name: 'Marker Fill',
       form: {
          'marker-fill': { type: 'color' , value: '#FF5C00' },
          'marker-opacity': { type: 'opacity' , value: 0.8 },
          'marker-allow-overlap': { type: 'hidden', value: true },
          'marker-placement':{ type:'hidden', value: 'point'},
          'marker-type':{ type:'hidden', value: 'ellipse'}
      }
};

var marker_radius = {
   name: 'Marker Width',
   form: {
      'marker-width': { type: 'width', value: 7 }
   }
};

var marker_stroke = {
   name: 'Marker Stroke',
   form: {
      'marker-line-width': { type: 'width', value: 2 },
      'marker-line-color': { type: 'color' , value: '#FFF' },
      'marker-line-opacity': { type: 'opacity', value: 1 }
  }
};

cdb.admin.forms.simple_form = {
  'polygon': [
    polygon_fill,
    polygon_stroke,
    label_text,
    label_text_properties,
    label_halo_properties
  ],
  'point': [
    marker_fill,
    marker_radius,
    marker_stroke,
    label_text,
    label_text_properties,
    label_halo_properties
  ],
  'line': [
    line_stroke,
    label_text,
    label_text_properties,
    label_halo_properties
  ]
};

cdb.admin.forms.bubble_form = [
  {
     name: 'Column',
     form: { 'property': { type: 'select' } } /* value is filled by wizard */
  },
  {
     name: 'Radius',
     title: 'Radius (min-max)',
     form: {
       'radius_min': { type: 'number', value: 3 },
       'radius_max': { type: 'number', value: 10 }
     },
     text: '- to -'
  },
  {
     name: 'Bubble fill',
     form: {
       'marker-fill': { type: 'color', value: '#FF5C00' },
       'marker-opacity': { type: 'opacity', value: 0.8 }
     }
  },
  {
     name: 'Bubble stroke',
     form: {
       'marker-line-width': { type: 'number', value: 2 },
       'marker-line-color': { type: 'color', value: '#FFF' },
       'marker-line-opacity': { type: 'opacity', value: 1.0 }
     }
  }
];

cdb.admin.forms.choroplet = [
  {
     name: 'Column',
     form: { 'property': { type: 'select' } } /* value is filled by wizard */
  },
  {
     name: 'Method',
     form: {
       'method': { type: 'select', value: 'Quantiles', extra: ['Quantiles'] }
     }
  },
  {
     name: 'Buckets',
     form: {
       'method': { type: 'select', value: '7 Buckets', extra: ['3 Buckets', '5 Buckets', '7 Buckets'] }
     }
  },

  {
     name: 'Color Ramp',
     form: {
       'color_ramp': { type: 'select', value: 'red', extra:['pink', 'red', 'black', 'green', 'blue'] },
       'polygon-opacity': { type: 'opacity', value: 0.8 }
     }
  },

  polygon_stroke,
  label_text,
  label_text_properties,
  label_halo_properties
];

cdb.admin.forms.density = [
  {
     name: 'Method',
     form: {
       'method': { type: 'select', value: 'Hexagons', extra: ['Hexagons', 'rectangles'] }
     }
  },
  {
     name: 'Buckets',
     form: {
       'method': { type: 'select', value: '5 Buckets', extra: ['5 Buckets', '7 Buckets'] }
     }
  },

  {
     name: 'color ramp',
     form: {
       'color_ramp': { type: 'select', value: 'red', extra:['pink', 'red', 'black', 'green', 'blue'] },
       'polygon-opacity': { type: 'opacity', value: 0.8 }
     }
  },

  polygon_stroke,
  {
    name: 'Polygon size',
    form: {
      'polygon-size': { type: 'number', value: 15, min: 1, max: 100 }
    }
  }
];


})();
