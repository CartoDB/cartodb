
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
      'line-width': { type: 'width', value: 0.5 },
      'line-color': { type: 'color' , value: '#FFF' },
      'line-opacity': { type: 'opacity', value: 1 }
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
      'text-name': { type: 'select', value: 'None',  extra: [], columns: 'string|number', extra_default: ['None'] }  /* value is filled by wizard */
     }
};

var label_text_properties = {
    name: 'Label Font',
    className: "label_text_properties",
    form: {
      'text-face-name': {
        type: 'select',
        value: "DejaVu Sans Book",
        extra: ["DejaVu Sans Book","unifont Medium", "Open Sans Regular", "Lato Regular", "Lato Bold", "Lato Bold Italic", "Graduate Regular", "Gravitas One Regular", "Old Standard TT Regular", "Old Standard TT Italic", "Old Standard TT Bold"]
      },
      'text-size': { type: 'number', value: 10, min: 1, max:50 },
      'text-fill': { type: 'color' , value: '#000' }
    }
};

var text_allow_overlap = {
  name: 'Label Overlap',
  className: "text_allow_overlap",
  form: {
    'text-allow-overlap': {
      type: 'select',
      value: true,
      extra: [true, false]
    },
    'text-placement-type': { type:'hidden', value: 'dummy' },
    'text-label-position-tolerance': { type: 'hidden', value: 0 }
  }
}

var label_placement = {
  name: 'Label Placement',
  className: "label_placement",
  form: {
    'text-placement': {
      type: 'select',
      value: 'point',
      extra: ['point', 'line', 'vertex', 'interior']
    }
  }
}

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
          'marker-width': { type: 'width', value: 10 },
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
      'marker-line-width': { type: 'width', value: 1.0 },
      'marker-line-color': { type: 'color' , value: '#FFF' },
      'marker-line-opacity': { type: 'opacity', value: 1.0 }
  }
};

// from mapbox doc
//var comp_op_options = ['clear','src','dst','src-over','dst-over','src-in','dst-in','src-out','dst-out','src-atop','dst-atop','xor','plus','minus','multiply','screen','overlay','darken','lighten','color-dodge','color-burn','hard-light','soft-light','difference','exclusion','contrast','invert','invert-rgb','grain-merge','grain-extract','hue','saturation','color','value']
var comp_op_options = [ 'None', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'xor', 'src-over' ];
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

cdb.admin.forms.polygon = {
  'polygon': [
    polygon_fill,
    polygon_stroke,
    polygon_comp_op,
    label_text,
    label_text_properties,
    label_halo_properties,
    label_text_offset,
    text_allow_overlap,
    label_placement
  ],
  'point': [
    marker_fill,
    marker_stroke,
    marker_comp_op,
    label_text,
    label_text_properties,
    label_halo_properties,
    label_text_offset,
    text_allow_overlap,
    label_placement
  ],
  'line': [
    line_stroke,
    line_comp_op,
    label_text,
    label_text_properties,
    label_halo_properties,
    label_text_offset,
    text_allow_overlap,
    label_placement
  ]
};


var column_category = {
  name: 'Column',
  form: { 'property': { type: 'select', columns: 'number|string|boolean'} } /* value is filled by wizard */
};
var column_numeric = {
  name: 'Column',
  form: { 'property': { type: 'select', columns: 'number'} } /* value is filled by wizard */
};

var column_torque_category = {
  name: 'Category Column',
  form: { 'property_cat': { type: 'select', columns: 'number|string|boolean'} } /* value is filled by wizard */
};

var column_numeric_date = {
  name: 'Column',
  form: { 'property': { type: 'select', columns: 'number|date'} } /* value is filled by wizard */
};

var column_numeric_date_with_cartodb_id = {
  name: 'Time Column',
  form: { 'property': { type: 'select', columns: 'number|date', extra_default: ['cartodb_id'], default_column: 'date'
  } } /* value is filled by wizard */
};

var column = {
  name: 'Column',
  form: { 'property': { type: 'select', columns: 'number|string'} } /* value is filled by wizard */
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
      'inverted_green', 'inverted_blue', 'spectrum1', 'spectrum2',
      'blue_states', 'purple_states', 'red_states',
      'inverted_blue_states', 'inverted_purple_states', 'inverted_red_states'] },
    'line-opacity': { type: 'opacity', value: 0.8 }
  }
};

var color_ramp_polygon = {
  name: 'Color Ramp',
  form: {
    'color_ramp': { type: 'select', value: 'red', extra:['pink',
      'red', 'black', 'green', 'blue',
      'inverted_pink', 'inverted_red', 'inverted_black',
      'inverted_green', 'inverted_blue', 'spectrum1', 'spectrum2',
      'blue_states', 'purple_states', 'red_states',
      'inverted_blue_states', 'inverted_purple_states', 'inverted_red_states'] },
    'polygon-opacity': { type: 'opacity', value: 0.8 }
  }
};

var color_ramp_point = {
  name: 'Color Ramp',
  form: {
    'color_ramp': { type: 'select', value: 'red', extra:['pink',
      'red', 'black', 'green', 'blue',
      'inverted_pink', 'inverted_red', 'inverted_black',
      'inverted_green', 'inverted_blue', 'spectrum1', 'spectrum2',
      'blue_states', 'purple_states', 'red_states',
      'inverted_blue_states', 'inverted_purple_states', 'inverted_red_states'] },
    'marker-opacity': { type: 'opacity', value: 0.8 }
  }
};

var bubble_form = [
  column_numeric, // Select column
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
       'marker-line-width': { type: 'number', value: 1.0, min:0, max:100, inc: 0.5 },
       'marker-line-color': { type: 'color', value: '#FFF' },
       'marker-line-opacity': { type: 'opacity', value: 1.0 }
     }
  },
  marker_comp_op
];

cdb.admin.forms.intensity = {
  'point': [
    {
      name: 'Marker Fill',
      form: {
        'marker-width': { type: 'width', value: 10 },
        'marker-fill': { type: 'color' , value: '#FFCC00' },
        'marker-opacity': { type: 'opacity' , value: 0.9 },
        'marker-allow-overlap': { type: 'hidden', value: true },
        'marker-placement':{ type:'hidden', value: 'point'},
        'marker-type':{ type:'hidden', value: 'ellipse'}
      }
    },
    marker_stroke
  ]
};

cdb.admin.forms.bubble = {
  'point': bubble_form,
  'polygon': bubble_form,
  'line': bubble_form
};

cdb.admin.forms.choropleth = {
  'polygon': [
    column_numeric,
    //method,
    buckets,
    QuantifyFn,
    color_ramp_polygon,
    polygon_stroke,
    polygon_comp_op,
    label_text,
    label_text_properties,
    label_halo_properties,
    label_text_offset,
    text_allow_overlap,
    label_placement
  ],

  'line': [
    column_numeric,
    //method,
    buckets,
    QuantifyFn,
    color_ramp_polyline,
    line_stroke_chroloplet,
    line_comp_op,
    label_text,
    label_text_properties,
    label_halo_properties,
    label_text_offset,
    text_allow_overlap,
    label_placement
  ],

  'point': [
    column_numeric,
    //method,
    buckets,
    QuantifyFn,
    color_ramp_point,
    {
      name: 'Marker Width',
      form: {
        'marker-width': { type: 'width', value: 10 },
        'marker-allow-overlap': { type: 'hidden', value: true },
        'marker-placement':{ type:'hidden', value: 'point'},
        'marker-type':{ type:'hidden', value: 'ellipse'}
      }
    },
    marker_stroke,
    marker_comp_op,
    label_text,
    label_text_properties,
    label_halo_properties,
    label_text_offset,
    text_allow_overlap,
    label_placement
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
        'marker-width': { type: 'width', value: 10 },
        'marker-opacity': { type: 'opacity' , value: 0.9 },
        'marker-allow-overlap': { type: 'hidden', value: true },
        'marker-placement':{ type:'hidden', value: 'point'},
        'marker-type':{ type:'hidden', value: 'ellipse'}
      }
    },
    marker_stroke
  ],
};


cdb.admin.forms.cluster = {
  'point': [
    {
    name: 'Buckets',
    form: {
      'method': { type: 'select', value: '3 Buckets', extra: ['2 Buckets', '3 Buckets', '4 Buckets', '5 Buckets'] }
    }
  }, {
    name: 'Marker Fill',
    form: {
      'marker-fill': { type: 'color' , value: '#FD8D3C' },
      'marker-opacity': { type: 'opacity' , value: 1 },
      'marker-allow-overlap': { type: 'hidden', value: true },
      'marker-placement':{ type:'hidden', value: 'point'},
      'marker-type':{ type:'hidden', value: 'ellipse'}
    }
  }, {
    name: 'Marker Stroke',
    form: {
      'marker-line-width': { type: 'width', value: 5.0 },
      'marker-line-color': { type: 'color' , value: '#fff' },
      'marker-line-opacity': { type: 'opacity', value: 1 }
    }
  }, {
    name: 'Radius',
    title: 'Marker size',
    form: {
      'radius_min': { type: 'number', value: 24, min:0, max:200 },
      'radius_max': { type: 'number', value: 64, min:0, max:200 }
    },
    text: '- to -'
  }, {
    title: 'Label Font',
    name: 'Label Text',
    className: "label_text_properties",
    form: {
      'text-face-name': {
        type: 'select',
        value: "DejaVu Sans Book",
        extra: ["DejaVu Sans Book","unifont Medium", "Open Sans Regular", "Lato", "Graduate", "Gravitas One", "Old Standard"]
      },
      'text-fill': { type: 'color' , value: '#fff' }
    }

  },{
    name: 'Label Halo',
    className: "label_halo_properties",
    form: {
      'text-halo-fill':  { type: 'color' , value: '#FFF' },
      'text-halo-radius': { type: 'number', value: 0.5, min: 0, max: 10, inc: 0.5}
    }
  }
  ]
};

cdb.admin.forms.category = {
  'polygon': [
    column_category,
    {
      name: 'Polygon Fill',
      form: {
        'polygon-opacity': { type: 'opacity' , value: 0.7 }
      }
    },
    polygon_stroke
  ],

  'line': [
    column_category,
    {
      name: 'LineStroke',
      form: {
        'line-width': { type: 'width', value: 2 },
        'line-opacity': { type: 'opacity', value: 0.7 }
      }
    }
  ],

  'point': [
    column_category,
    {
      name: 'Marker Fill',
      form: {
        'marker-width': { type: 'width', value: 10 },
        'marker-opacity': { type: 'opacity' , value: 0.9 },
        'marker-allow-overlap': { type: 'hidden', value: true },
        'marker-placement':{ type:'hidden', value: 'point'},
        'marker-type':{ type:'hidden', value: 'ellipse'}
      }
    },
    marker_stroke
  ],
};



cdb.admin.forms.density = {
  'point': [
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
            'inverted_green', 'inverted_blue', 'spectrum1', 'spectrum2',
            'blue_states', 'purple_states', 'red_states',
            'inverted_blue_states', 'inverted_purple_states', 'inverted_red_states'] },
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
  ]
};

var sharedForTorqueAndTorqueCat = {
  'point': [
    column_numeric_date_with_cartodb_id,
    {
      name: 'Marker type',
      form: {
        'marker-type': { type: 'select', value: 'ellipse', extra: ['ellipse', 'rectangle'] },

        // this layer-type value must be present among the form options for the torque wizards to work as expected!
        // see issue #1166 on github, for related bug report and discussion.
        'layer-type': { type: 'hidden', value: 'torque' }
      }
    },
    {
      name: 'Marker Fill',
      form: {
        'marker-width': { type: 'width', value: 6 },
        'marker-fill': { type: 'color' , value: '#0F3B82' },
        'marker-opacity': { type: 'opacity' , value: 0.9 }
      }
    },
    {
      name: 'Marker Stroke',
      form: {
        'marker-line-width': { type: 'width', value: 0 },
        'marker-line-color': { type: 'color' , value: '#FFF' },
        'marker-line-opacity': { type: 'opacity', value: 1.0 }
      }
    },
    {
      name: 'Duration (secs)',
      form: {
        'torque-duration': { type: 'number', value: 30, min: 3, max: 120 },
      }
    },
    {
      name: 'Steps',
      form: {
        'torque-frame-count': { type: 'select', value: 256, extra: [1, 64, 128, 256, 512, 1024, 2048] }
      }
    },
    {
      name: 'Blend Mode',
      form: {
        'torque-blend-mode': { type: 'select', value: 'lighter', extra: [
          'lighter', 'multiply', 'source-over', 'xor' //, 'source-atop', 'source-in', 'source-out', 'destination-atop', 'destination-in', 'destination-out', 'destination-over',  'xor', 'copy'
        ]},
      }
    },
    {
      name: 'Trails',
      form: {
        'torque-trails': { type: 'number', value: 2, min: 0, max: 5 },
      }
    },
    {
      name: 'Resolution',
      form: {
        'torque-resolution': { type: 'select', value: 2, extra: [1, 2, 4, 8, 16, 32] }
      }
    }
  ]

};

cdb.admin.forms.torque = clone(sharedForTorqueAndTorqueCat);

// Prepend the cumulative option for torque form only.
cdb.admin.forms.torque['point'].unshift({
  name: 'Cumulative',
  form: {
    'torque-cumulative': {type: 'switch', value: false}
  }
});

cdb.admin.forms.torque_cat = clone(sharedForTorqueAndTorqueCat);


cdb.admin.forms.torque_heat = {
  'point': [

    {
      name: 'Marker size',
      form: {
        'marker-width': { type: 'width', value: 35 },
        'layer-type': { type: 'hidden', value: 'torque' },
        'marker-file': { type: 'hidden', value: 'url(http://s3.amazonaws.com/com.cartodb.assets.static/alphamarker.png)' },
        'image-filters': { type: 'hidden', value: 'colorize-alpha(blue, cyan, lightgreen, yellow , orange, red)' }

      }
    }
    ,
    {
      name: 'Opacity',
      form: {
        'marker-opacity': { type: 'opacity' , value: 0.4 }
      }
    },
    {
      name: 'Animated',
      form: {
        'heat-animated': {type: 'switch', value: false}
      }
    },
    {
      name: 'Cumulative',
      form: {
        'torque-cumulative': {type: 'switch', value: false}
      }
    },
    column_numeric_date_with_cartodb_id,

    {
      name: 'Duration (secs)',
      form: {
        'torque-duration': { type: 'number', value: 10, min: 3, max: 120 },
      }
    },
    {
      name: 'Steps',
      form: {
        'torque-frame-count': { type: 'select', value: 1, extra: [1,16,32, 64, 128, 256, 512, 1024, 2048] }
      }
    },
    {
      name: 'Trails',
      form: {
        'torque-trails': { type: 'number', value: 2, min: 0, max: 5 },
      }
    },
    {
      name: 'Resolution',
      form: {
        'torque-resolution': { type: 'select', value: 8, extra: [1, 2, 4, 8, 16, 32] }
      }
    }
  ]
}



// insert category column after time column
cdb.admin.forms.torque_cat['point'].splice(2, 0, column_torque_category);

// change blend mode to not distort the colors
_.find(cdb.admin.forms.torque_cat['point'], function(o) { return o.name === 'Blend Mode' }).form['torque-blend-mode'].value = 'source-over';


})();
