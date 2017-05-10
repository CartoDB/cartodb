var adapter = require('../../../../src/windshaft-integration/legends/rule-to-category-legend-adapter');

describe('src/windshaft-integration/legends/rule-to-category-legend-adapter', function () {
  beforeEach(function () {
    this.rule = {
      'selector': '#layer',
      'prop': 'marker-fill',
      'mapping': '=',
      'buckets': [
        {
          'filter': {
            'type': 'category',
            'name': 'Category 1'
          },
          'value': '#AAAAAA'
        },
        {
          'filter': {
            'type': 'category',
            'name': 'Category 2'
          },
          'value': '#BBBBBB'
        },
        {
          'filter': {
            'type': 'default'
          },
          'value': '#CCCCCC'
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
        categories: [
          { label: 'Category 1', value: '#AAAAAA' },
          { label: 'Category 2', value: '#BBBBBB' }
        ],
        defaultValue: '#CCCCCC'
      });
    });

    it('should include and empty defaultValue property if there is no bucket with a default filter', function () {
      this.rule.buckets = [
        {
          'filter': {
            'type': 'category',
            'name': 'Category 1'
          },
          'value': '#AAAAAA'
        },
        {
          'filter': {
            'type': 'category',
            'name': 'Category 2'
          },
          'value': '#BBBBBB'
        }
      ];

      var attrs = adapter.adapt(this.rule);
      expect(attrs).toEqual({
        categories: [
          { label: 'Category 1', value: '#AAAAAA' },
          { label: 'Category 2', value: '#BBBBBB' }
        ],
        defaultValue: undefined
      });
    });
  });
});
