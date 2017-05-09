var adapter = require('../../../../src/windshaft-integration/legends/rule-to-choropleth-legend-adapter');

describe('src/windshaft-integration/legends/rule-to-choropleth-legend-adapter', function () {
  beforeEach(function () {
    this.rule = {
      'selector': '#layer',
      'prop': 'polygon-fill',
      'mapping': '>',
      'buckets': [
        {
          'filter': {
            'type': 'range',
            'start': 0,
            'end': 1000
          },
          'value': '#AAAAAA'
        },
        {
          'filter': {
            'type': 'range',
            'start': 1000,
            'end': 2000
          },
          'value': '#BBBBBB'
        },
        {
          'filter': {
            'type': 'range',
            'start': 2000,
            'end': 3000
          },
          'value': '#CCCCCC'
        }
      ],
      'stats': {
        'filter_avg': 1975
      }
    };
  });

  describe('.canAdapt', function () {
    it('should return true if prop is valid', function () {
      expect(adapter.canAdapt(this.rule)).toBeTruthy();
    });

    it('should return false if prop is not valid', function () {
      this.rule.prop = 'marker-width';
      expect(adapter.canAdapt(this.rule)).toBeFalsy();
    });
  });

  describe('.adapt', function () {
    it('should return attrs', function () {
      var attrs = adapter.adapt(this.rule);
      expect(attrs).toEqual({
        colors: [
          { label: '0', value: '#AAAAAA' },
          { label: '', value: '#BBBBBB' },
          { label: '3000', value: '#CCCCCC' }
        ],
        avg: 1975,
        max: 3000,
        min: 0
      });
    });
  });
});
