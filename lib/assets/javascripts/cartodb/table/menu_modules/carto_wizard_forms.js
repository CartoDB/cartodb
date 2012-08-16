
(function() {
cdb.admin.forms = {};


var polygon_stroke = {
     name: 'Polygon Stroke',
     form: {
        'line-width': { type: 'width', value: 1 },
        'line-color': { type: 'color' , value: '#00FF00' },
        'line-opacity': { type: 'opacity', value: 0.6 }
    }
}

cdb.admin.forms.simple_form = [
    {
       name: 'Marker Fill',
       form: {
         'polygon-fill': { type: 'color' , value: '#00FF00' },
          'polygon-opacity': { type: 'opacity' , value: 0.6 }
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
    polygon_stroke
];

cdb.admin.forms.bubble_form = [
  {
     name: 'Column',
     form: { 'property': { type: 'select' } } /* value is filled by wizard */
  },
  {
     name: 'Radius',
     form: {
       'radius_min': { type: 'number', value: 1 },
       'radius_max': { type: 'number', value: 10 }
     }
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
       'method': { type: 'select', value: '5 Buckets', extra: ['3 Buckets', '5 Buckets', '7 Buckets'] }
     }
  },

  {
     name: 'Color Ramp',
     form: {
       'color_ramp': { type: 'color', value: '#00FF00' },
       'polygon-opacity': { type: 'opacity', value: 0.9 }
     }
  },

  polygon_stroke
];


})();
