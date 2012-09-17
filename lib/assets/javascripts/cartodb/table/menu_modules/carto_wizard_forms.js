
(function() {

cdb.admin.forms = {};

var polygon_stroke = {
     name: 'Polygon Stroke',
     form: {
        'line-width': { type: 'width', value: 1 },
        'line-color': { type: 'color' , value: '#00FF00' },
        'line-opacity': { type: 'opacity', value: 0.6 }
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
        value: "Open Sans Regular",
        extra: ["Open Sans Regular","Open Sans Bold", "Open Sans Italic"]
      },
      'text-size': { type: 'number', value: 10, min: 1 },
      'text-fill': { type: 'color' , value: '#000' }
    }
};

var label_halo_properties = {
  name: 'Label Halo',
  form: {
    'text-halo-fill':  { type: 'color' , value: '#AAA' },
    'text-halo-radius': { type: 'number', value: 1, min: 0}
  }
};


/*
 *
 * text-face-name:@sans_bold;
  text-placement:point;
  text-fill:@country_text;
  text-halo-fill: @country_halo;
  text-halo-radius: 1;
  */

cdb.admin.forms.simple_form = [
    {
       name: 'Marker Fill',
       form: {
          'marker-fill': { type: 'color' , value: '#00FF00' },
          'marker-opacity': { type: 'opacity' , value: 0.6 },
          'marker-allow-overlap': { type: 'hidden', value: true }
      }
    },
    {
       name: 'Marker Stroke',
       form: {
          'marker-line-width': { type: 'width', value: 1 },
          'marker-line-color': { type: 'color' , value: '#00FF00' },
          'marker-line-opacity': { type: 'opacity', value: 0.6 }
      }
    },
    {
       name: 'Polygon Fill',
       form: {
          'polygon-fill': { type: 'color' , value: '#00FF00' },
          'polygon-opacity': { type: 'opacity' , value: 0.6 }
      }
    },
    polygon_stroke,
    label_text,
    label_text_properties,
    label_halo_properties
];

cdb.admin.forms.bubble_form = [
  {
     name: 'Column',
     form: { 'property': { type: 'select' } } /* value is filled by wizard */
  },
  {
     name: 'Radius',
     title: 'Radius (min-max)',
     form: {
       'radius_min': { type: 'number', value: 1 },
       'radius_max': { type: 'number', value: 10 }
     },
     text: '- to -'
  },
  {
     name: 'Bubble fill',
     form: {
       'marker-fill': { type: 'color', value: '#00FF00' },
       'marker-opacity': { type: 'opacity', value: 0.9 }
     }
  },
  {
     name: 'Bubble stroke',
     form: {
       'marker-line-width': { type: 'number', value: 1 },
       'marker-line-color': { type: 'color', value: '#00FF00' },
       'marker-line-opacity': { type: 'opacity', value: 0.9 }
     }
  }
];

cdb.admin.forms.choroplet = [
  {
     name: 'column',
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
       'method': { type: 'select', value: '5 Buckets', extra: ['3 Buckets', '5 Buckets', '7 Buckets'] }
     }
  },

  {
     name: 'Color Ramp',
     form: {
       'color_ramp': { type: 'select', value: 'red', extra:['pink', 'red', 'black', 'green', 'blue'] },
       'polygon-opacity': { type: 'opacity', value: 0.9 }
     }
  },

  polygon_stroke
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
       'method': { type: 'select', value: '5 Buckets', extra: ['3 Buckets', '5 Buckets', '7 Buckets'] }
     }
  },

  {
     name: 'color ramp',
     form: {
       'color_ramp': { type: 'select', value: 'red', extra:['pink', 'red', 'black', 'green', 'blue'] },
       'polygon-opacity': { type: 'opacity', value: 0.9 }
     }
  },

  polygon_stroke,
  {
    name: 'Polygon size',
    form: {
      'polygon-size': { type: 'number', value: 15, min: 1, max: 100 },
    }
  }
];


})();
