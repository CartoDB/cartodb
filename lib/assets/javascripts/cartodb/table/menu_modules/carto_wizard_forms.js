
(function() {

cdb.admin.forms = {};

var clone = function(a) {
   return JSON.parse(JSON.stringify(a));
};

cdb.admin.forms.get = function(what) {
  return clone(cdb.admin.forms[what]);
};


var polygon_stroke = {
   name: 'Polygon Stroke',
   form: {
      'line-width': { type: 'width', value: 1 },
      'line-color': { type: 'color' , value: '#FFF' },
      'line-opacity': { type: 'opacity', value: 1.0 }
   }
};

var line_stroke = {
   name: 'LineStroke',
   form: {
      'line-width': { type: 'width', value: 2 },
      'line-color': { type: 'color' , value: '#FF6600' },
      'line-opacity': { type: 'opacity', value: 0.7 }
   }
};

var line_stroke_chroloplet = {
   name: 'LineStroke',
   form: {
      'line-width': { type: 'width', value: 1 },
      'line-color': { type: 'hidden' , value: '#FF6600' },
      'line-opacity': { type: 'opacity', value: 0.8 }
   }
};

var polygon_fill = {
   name: 'Polygon Fill',
   form: {
      'polygon-fill': { type: 'color' , value: '#FF6600', extra: { image_property: 'polygon-pattern-file', image_kind: 'pattern' }},
      'polygon-opacity': { type: 'opacity_polygon' , value: 0.7 }
  }
};

var label_text = {
     name: 'Label Text',
     className: "label_text",
     form: {
      'text-name': { type: 'select' }  /* value is filled by wizard */
     }
};

var label_text_properties = {
    name: 'Label Font',
    className: "label_text_properties",
    form: {
      'text-face-name': {
        type: 'select',
        value: "DejaVu Sans Book",
        extra: ["DejaVu Sans Book","unifont Medium"]
      },
      'text-size': { type: 'number', value: 10, min: 1, max:50 },
      'text-fill': { type: 'color' , value: '#000' },
      'text-allow-overlap': { type: 'hidden', value: true }
    }
};

var label_text_offset =  {
    name: 'Label Offset',
    className: "label_text_offset",
    form: {
      'text-dy': { type: 'number', value: -10, min: -30, max: 30 }
    }
}

var label_halo_properties = {
  name: 'Label Halo',
  className: "label_halo_properties",
  form: {
    'text-halo-fill':  { type: 'color' , value: '#FFF' },
    'text-halo-radius': { type: 'number', value: 1, min: 0, max: 10, inc: 0.5}
  }
};

var marker_fill = {
       name: 'Marker Fill',
       form: {
          'marker-width': { type: 'width', value: 12 },
          'marker-fill': { type: 'color' , value: '#FF6600', extra: { image_property: 'marker-file' }},
          'marker-opacity': { type: 'opacity' , value: 0.9 },
          'marker-allow-overlap': { type: 'hidden', value: true },
          'marker-placement':{ type:'hidden', value: 'point'},
          'marker-type':{ type:'hidden', value: 'ellipse'}
      }
};

var marker_stroke = {
   name: 'Marker Stroke',
   form: {
      'marker-line-width': { type: 'width', value: 3 },
      'marker-line-color': { type: 'color' , value: '#FFF' },
      'marker-line-opacity': { type: 'opacity', value: 0.9 }
  }
};

// from mapbox doc
//var comp_op_options = ['clear','src','dst','src-over','dst-over','src-in','dst-in','src-out','dst-out','src-atop','dst-atop','xor','plus','minus','multiply','screen','overlay','darken','lighten','color-dodge','color-burn','hard-light','soft-light','difference','exclusion','contrast','invert','invert-rgb','grain-merge','grain-extract','hue','saturation','color','value']
var comp_op_options = [ 'None', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn' ];
var comp_op_default_value = 'none';

var polygon_comp_op= {
  name: 'Composite operation',
  form: {
    'polygon-comp-op': {
      type: 'select',
      value: comp_op_default_value,
      extra: comp_op_options
    }
  }
}

var line_comp_op= {
  name: 'Composite operation',
  form: {
    'line-comp-op': {
      type: 'select',
      value: comp_op_default_value,
      extra: comp_op_options
    }
  }
}

var marker_comp_op= {
  name: 'Composite operation',
  form: {
    'marker-comp-op': {
      type: 'select',
      value: comp_op_default_value,
      extra: comp_op_options
    }
  }
}

cdb.admin.forms.simple_form = {
  'polygon': [
    polygon_fill,
    polygon_stroke,
    polygon_comp_op,
    label_text,
    label_text_properties,
    label_halo_properties,
    label_text_offset
  ],
  'point': [
    marker_fill,
    marker_stroke,
    marker_comp_op,
    label_text,
    label_text_properties,
    label_halo_properties,
    label_text_offset
  ],
  'line': [
    line_stroke,
    line_comp_op,
    label_text,
    label_text_properties,
    label_halo_properties,
    label_text_offset
  ]
};


var column = {
  name: 'Column',
  form: { 'property': { type: 'select' } } /* value is filled by wizard */
};

var method = {
  name: 'Method',
  form: {
    // enable this when there is more than one method
    'stats_method': { type: 'select', value: 'Quantiles', extra: ['Quantiles'] }
  }
};

var buckets = {
  name: 'Buckets',
  form: {
    'method': { type: 'select', value: '7 Buckets', extra: ['3 Buckets', '5 Buckets', '7 Buckets'] }
  }
};

var QuantifyFn = {
  name: 'Quantification',
  form: {
    'qfunction': { type: 'select', value: 'Quantile' /*'Jenks'*/, extra: [
      'Jenks',
      'Equal Interval',
      'Heads/Tails',
      'Quantile'
     ]
    }
  }
};

var color_ramp_polyline = {
  name: 'Color Ramp',
  form: {
    'color_ramp': { type: 'select', value: 'red', extra:['pink',
      'red', 'black', 'green', 'blue',
      'inverted_pink', 'inverted_red', 'inverted_black',
      'inverted_green', 'inverted_blue', 'spectrum1', 'spectrum2'] },
    'line-opacity': { type: 'opacity', value: 0.8 }
  }
};

var color_ramp_polygon = {
  name: 'Color Ramp',
  form: {
    'color_ramp': { type: 'select', value: 'red', extra:['pink',
      'red', 'black', 'green', 'blue',
      'inverted_pink', 'inverted_red', 'inverted_black',
      'inverted_green', 'inverted_blue', 'spectrum1', 'spectrum2'] },
    'polygon-opacity': { type: 'opacity', value: 0.8 }
  }
};

cdb.admin.forms.bubble_form = [
  column, // Select column
  QuantifyFn,
  {
     name: 'Radius',
     title: 'Radius (min-max)',
     form: {
       'radius_min': { type: 'number', value: 10, min:0, max:100 },
       'radius_max': { type: 'number', value: 25, min:0, max:100 }
     },
     text: '- to -'
  },
  {
     name: 'Bubble fill',
     form: {
       'marker-fill': { type: 'color', value: '#FF5C00' },
       'marker-opacity': { type: 'opacity', value: 0.9 }
     }
  },
  {
     name: 'Bubble stroke',
     form: {
       'marker-line-width': { type: 'number', value: 2, min:0, max:100, inc: 0.5 },
       'marker-line-color': { type: 'color', value: '#FFF' },
       'marker-line-opacity': { type: 'opacity', value: 1.0 }
     }
  },
  marker_comp_op
];

cdb.admin.forms.intensity = [
  {
    name: 'Marker Fill',
    form: {
      'marker-width': { type: 'width', value: 12 },
      'marker-fill': { type: 'color' , value: '#FFCC00' },
      'marker-opacity': { type: 'opacity' , value: 0.9 },
      'marker-allow-overlap': { type: 'hidden', value: true },
      'marker-placement':{ type:'hidden', value: 'point'},
      'marker-type':{ type:'hidden', value: 'ellipse'}
    }
  },
  marker_stroke
];

cdb.admin.forms.choropleth = {
  'polygon': [
    column,
    //method,
    buckets,
    QuantifyFn,
    color_ramp_polygon,
    polygon_stroke,
    polygon_comp_op,
    label_text,
    label_text_properties,
    label_halo_properties,
    label_text_offset
  ],

  'line': [
    column,
    //method,
    buckets,
    QuantifyFn,
    color_ramp_polyline,
    line_stroke_chroloplet,
    line_comp_op,
    label_text,
    label_text_properties,
    label_halo_properties,
    label_text_offset
  ],

  'point': [
    column,
    //method,
    buckets,
    QuantifyFn,
    color_ramp_polygon,
    marker_stroke,
    marker_comp_op,
    label_text,
    label_text_properties,
    label_halo_properties,
    label_text_offset
  ],
};

cdb.admin.forms.color = {
  'polygon': [
    column,
    {
      name: 'Polygon Fill',
      form: {
        'polygon-opacity': { type: 'opacity' , value: 0.7 }
      }
    },
    polygon_stroke
  ],

  'line': [
    column,
    {
      name: 'LineStroke',
      form: {
        'line-width': { type: 'width', value: 2 },
        'line-opacity': { type: 'opacity', value: 0.7 }
      }
    }
  ],

  'point': [
    column,
    {
      name: 'Marker Fill',
      form: {
        'marker-width': { type: 'width', value: 12 },
        'marker-opacity': { type: 'opacity' , value: 0.9 },
        'marker-allow-overlap': { type: 'hidden', value: true },
        'marker-placement':{ type:'hidden', value: 'point'},
        'marker-type':{ type:'hidden', value: 'ellipse'}
      }
    },
    marker_stroke
  ],
};

cdb.admin.forms.density = [
  {
     name: 'Method',
     form: {
       'geometry_type': { type: 'select', value: 'Hexagons', extra: ['Hexagons', 'Rectangles'] }
     }
  },
  {
     name: 'Buckets',
     form: {
       'method': { type: 'select', value: '5 Buckets', extra: ['5 Buckets', '7 Buckets'] }
     }
  },

  {
     name: 'Color ramp',
     form: {
       'color_ramp': { type: 'select', value: 'red', extra:['pink',
          'red', 'black', 'green', 'blue',
          'inverted_pink', 'inverted_red', 'inverted_black',
          'inverted_green', 'inverted_blue', 'spectrum1', 'spectrum2'] },
       'polygon-opacity': { type: 'opacity', value: 0.8 }
     }
  },

  polygon_stroke,
  {
    name: 'Polygon size',
    form: {
      'polygon-size': { type: 'number', value: 15, min: 1, max: 100 }
    }
  },

  polygon_comp_op
];

cdb.admin.forms.torque = [
  column,
  {
    name: 'Marker Fill',
    form: {
      'marker-width': { type: 'width', value: 12 },
      'marker-fill': { type: 'color' , value: '#FFCC00' },
      'marker-opacity': { type: 'opacity' , value: 0.9 }
    }
  },
  marker_stroke,
  {
    name: 'Duration (secs)',
    form: {
      'torque-duration': { type: 'number', value: 30 },
    }
  },
  {
    name: 'Steps',
    form: {
      'torque-steps': { type: 'number', value: 512 },
    }
  },
  {
    name: 'Blend Mode',
    form: {
      'torque-blend-mode': { type: 'select', value: 'lighter', extra: [
        'lighter', 'source-over'
      ]},
    }
  },
  {
    name: 'Trails',
    form: {
      'torque-trails': { type: 'select', value: 2, extra: [0, 1, 2, 3, 4, 5]},
    }
  }

];


})();
