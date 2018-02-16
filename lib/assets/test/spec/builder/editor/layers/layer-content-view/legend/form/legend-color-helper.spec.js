var LegendColorHelper = require('builder/editor/layers/layer-content-views/legend/form/legend-color-helper');

describe('editor/layers/layer-content-views/legends/form/legend-color-helper', function () {
  it('should return collection category items properly', function () {
    var style = {
      'attribute': 'line',
      'attribute_type': 'string',
      'range': [
        '#555',
        '#5B3F95',
        '#1D6996',
        '#129C63',
        '#73AF48',
        '#EDAD08',
        '#E17C05',
        '#C94034',
        '#BA0040',
        '#8E1966',
        '#6F3072'
      ],
      'domain': [
        'Others',
        '\'L1\'',
        '\'L10\'',
        '\'L12\'',
        '\'L2\'',
        '\'L3\'',
        '\'L4\'',
        '\'L5\'',
        '\'L6\'',
        '\'L7\'',
        '\'L9\''
      ]
    };

    var categories = LegendColorHelper.getCategories(style);
    expect(categories.length).toBe(11);
    expect(categories[0].fill.color.fixed).toBe('#555');
    expect(categories[0].title).toBe('Others');
    expect(categories[3].fill.color.fixed).toBe('#129C63');
    expect(categories[3].title).toBe('\'L12\'');
    expect(categories[10].fill.color.fixed).toBe('#6F3072');
    expect(categories[10].title).toBe('\'L9\'');
  });

  it('should return collection category items properly for choropleth style', function () {
    var style = {
      'attribute': 'line',
      'attribute_type': 'number',
      'range': [
        '#555',
        '#5B3F95',
        '#1D6996',
        '#129C63',
        '#73AF48',
        '#EDAD08',
        '#E17C05',
        '#C94034',
        '#BA0040',
        '#8E1966',
        '#6F3072'
      ]
    };

    var categories = LegendColorHelper.getCategories(style);
    expect(categories.length).toBe(11);
    expect(categories[0].fill.color.fixed).toBe('#555');
    expect(categories[0].title).toBe('');
    expect(categories[3].fill.color.fixed).toBe('#129C63');
    expect(categories[3].title).toBe('');
    expect(categories[10].fill.color.fixed).toBe('#6F3072');
    expect(categories[10].title).toBe('');
  });

  it('should return single category item properly', function () {
    var style = {
      'fixed': '#d4d438',
      'opacity': 1
    };

    var categories = LegendColorHelper.getCategories(style);
    expect(categories.length).toBe(1);
    expect(categories[0].fill.color.fixed).toBe('#d4d438');
    expect(categories[0].title).toBe('');
  });

  it('should return bubble properly', function () {
    var style = {
      'fixed': '#d4d438',
      'opacity': 1
    };

    var bubble = LegendColorHelper.getBubbles(style);
    expect(bubble.color.fixed).toBe('#d4d438');
  });

  describe('simpleColor', function () {
    it('should return same output as input in color object provided', function () {
      var color = {
        fixed: '#fabada',
        image: 'icon.svg'
      };

      var categories = LegendColorHelper.getCategories(color);

      expect(categories.length).toBe(1);
      expect(categories[0].fill.color.fixed).toEqual('#fabada');
      expect(categories[0].fill.color.image).toEqual('icon.svg');
    });
  });

  describe('collectionColor', function () {
    it('', function () {
      var color = {
        attribute: 'name',
        range: ['#fabada', '#c0ffee'],
        domain: ['Pedro', 'Pablo'],
        images: ['pedro.png', '']
      };

      var categories = LegendColorHelper.getCategories(color);

      expect(categories.length).toBe(2);
      expect(categories[0].fill.color.fixed).toEqual('#fabada');
      expect(categories[0].fill.color.opacity).toBe(1);
      expect(categories[0].fill.color.image).toEqual('pedro.png');
      expect(categories[0].title).toEqual('Pedro');
      expect(categories[1].fill.color.fixed).toEqual('#c0ffee');
      expect(categories[1].fill.color.opacity).toBe(1);
      expect(categories[1].fill.color.image).toEqual('');
      expect(categories[1].title).toEqual('Pablo');
    });
  });
});
