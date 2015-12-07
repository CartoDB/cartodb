
var _ = cartodb._
var d3 = cartodb.d3

DENSITY_CARTOCSS = [
'#layer {',
'[zoom > 13] {',
  'marker-width: 3; ',
  'marker-fill-opacity: 1;',
  'comp-op: screen;',
  'marker-fill:  #7ce3ae;',
  'marker-line-color: #157242;',
  'marker-line-width: 0.5;',
  '[zoom>=16] {marker-width: 4;}',
'}',
'[zoom <= 13] {',
  'marker-width: 1; ',
  'marker-fill-opacity: 0.8;',
  'comp-op: screen;',
  '[value > 4]  {marker-fill: #0E5933;}',
  '[value > 10] {marker-fill:  #157242;}',
  '[value > 15] {marker-fill:  #1B8B52;}',
  '[value > 20] {marker-fill:  #22A562;}',
  '[value > 25] {marker-fill:  #a6ecc8;}',
  '[zoom>=11] { marker-width: 2;}',
  '[zoom>=13] { marker-width: 3;}',
'}',
'}'].join('\n');


var MiniPecan = {

  bubble: function(min, max, opts) {
      opts = opts || {}
      return _.template([
        '#layer {',
        '  marker-width: <%- min %> + [value]*<%- ratio %>;',
        '  marker-fill-opacity: 1.0;',
        '  marker-fill: #FF2900; ',
        '}'
      ].join(''))({
        min: (opts.marker_width_min || 2) - min/max,
        ratio: 1/max
      });
  },

  category: function(categories, colors, opts) {
      opts = opts || {}
      var cats = {};
      var c = [
        '#layer {',
          '::case[zoom>=13] {',
            'marker-line-color: #e5dfa5;',
            'marker-fill: transparent;',
            'marker-line-width: 3;',
            'marker-line-opacity: 0.2;',
            '[zoom>=9]{marker-width: 2;}',
            '[zoom>=11]{marker-width: 3;}',
            '[zoom>=13]{marker-width: 4;}',
            '[zoom>=14]{marker-width: 6;}',
            '[zoom>=16]{marker-width: 8;}',
            '[zoom>=18]{marker-width: 10;}',
          '}',
          '::fill[zoom>=1] {',
            'marker-width: 1;',
            'marker-opacity: 1;',
            'marker-fill: #5B788E;',
            'marker-line-width: 0;',
            '[zoom>=9]{marker-width: 1;}',
            '[zoom>=11]{marker-width: 1.5;}',
            '[zoom>=13]{marker-width: 2;}',
            '[zoom>=14]{marker-width: 3;}',
            '[zoom>=16]{marker-width: 4;}',
            '[zoom>=18]{marker-width: 5;}'
          ]
      for (var i = 0; i < categories.length; ++i) {
          var escaped = categories[i].replace(/'/g, "\\'");
          c.push('[value = "' +  escaped + '"]{marker-fill: ' + colors[i] + ';}')
      }
      c.push('}}');
      return c.join('\n');
  },

  choropleth: function(values, buckets) {
    buckets = buckets || 5;
    var c = [
      '#layer {',
      '  marker-width: 1;',
      '  marker-fill-opacity: 1.0;',
      '  marker-fill: #FF2900; ',
    ]
    var colorScale = colorbrewer.YlOrRd[buckets];
    for (var i = 0; i < buckets; ++i) {
      var threshold = d3.quantile(values, (i+1)/buckets);
      c.push('[value > ' + threshold + ']{ marker-fill: ' + colorScale[i] + ';}')
    }
    c.push('}');
    return c.join('\n');
  },

  bubbleBucket: function(values, buckets) {
    buckets = buckets || 5;
    var c = [
      '#layer {',
        'marker-width: 2;',
        'marker-fill-opacity: 0.8;',
        'marker-fill: #7ce3ae; ',
        'marker-line-color: #157242;',
        'marker-line-width: 0.5;'
    ]
    for (var i = 0; i < buckets; ++i) {
      var threshold = d3.quantile(values, (i+1)/buckets);
      c.push('[value > ' + threshold + ']{ marker-width: ' + ((i+1)*2.0 + 2.0) + ';}')
    }
    c.push('}');
    return c.join('\n');
  },

  density: function(values) {
    return DENSITY_CARTOCSS;
  }
};
