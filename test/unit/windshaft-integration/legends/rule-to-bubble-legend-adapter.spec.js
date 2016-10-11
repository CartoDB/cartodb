var adapter = require('../../../../src/windshaft-integration/legends/rule-to-bubble-legend-adapter');

describe('src/windshaft-integration/legends/rule-to-bubble-legend-adapter', function () {
  beforeEach(function () {
    this.rule = {
      'selector': '#layer',
      'prop': 'marker-width',
      'mapping': '>',
      'buckets': [
        {
          'filter': {
            'type': 'range',
            'start': 10,
            'end': 1000
          },
          'value': 10
        },
        {
          'filter': {
            'type': 'range',
            'start': 1000,
            'end': 2000
          },
          'value': 14
        },
        {
          'filter': {
            'type': 'range',
            'start': 2000,
            'end': 3000
          },
          'value': 20
        },
        {
          'filter': {
            'type': 'range',
            'start': 3000,
            'end': 4000
          },
          'value': 26
        },
        {
          'filter': {
            'type': 'range',
            'start': 4000,
            'end': 5000
          },
          'value': 32
        }
      ],
      'stats': {
        'filter_avg': 3500
      }
    };
  });

  describe('.canAdapt', function () {
    it('should return true if prop is valid', function () {
      expect(adapter.canAdapt(this.rule)).toBeTruthy();

      // lines
      this.rule.prop = 'line-width';
      expect(adapter.canAdapt(this.rule)).toBeTruthy();
    });

    it('should return false if prop is not valid', function () {
      this.rule.prop = 'marker-fill';
      expect(adapter.canAdapt(this.rule)).toBeFalsy();
    });
  });

  describe('.adapt', function () {
    it('should return attrs', function () {
      var attrs = adapter.adapt(this.rule);
      expect(attrs).toEqual({
        values: [
          10,
          1000,
          2000,
          3000,
          4000,
          5000
        ],
        sizes: [
          10,
          14,
          20,
          26,
          32
        ],
        avg: 3500
      });
    });
  });
});
