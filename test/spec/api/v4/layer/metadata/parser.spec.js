var metadataParser = require('../../../../../../src/api/v4/layer/metadata/parser');

describe('api/v4/layer/metadata/parser', function () {
  describe('.getMetadataFromRules', function () {
    it('should parse correctly the range rules', function () {
      // From:
      //   marker-width: ramp([scalerank], range(5, 20), quantiles(4));
      //   marker-fill-opacity: ramp([pop_max], range(0,1), jenks);
      var rules = [
        {
          'selector': '#layer',
          'prop': 'marker-width',
          'column': 'scalerank',
          'mapping': '>',
          'buckets': [
            {
              'filter': {
                'type': 'range',
                'start': 0,
                'end': 6
              },
              'value': 5
            },
            {
              'filter': {
                'type': 'range',
                'start': 6,
                'end': 7
              },
              'value': 10
            },
            {
              'filter': {
                'type': 'range',
                'start': 7,
                'end': 7
              },
              'value': 15
            },
            {
              'filter': {
                'type': 'range',
                'start': 7,
                'end': 10
              },
              'value': 20
            }
          ],
          'stats': {
            'filter_avg': 6.642174269325321
          }
        },
        {
          'selector': '#layer',
          'prop': 'marker-fill-opacity',
          'column': 'pop_max',
          'mapping': '>',
          'buckets': [
            {
              'filter': {
                'type': 'range',
                'start': -99,
                'end': 37945
              },
              'value': 0
            },
            {
              'filter': {
                'type': 'range',
                'start': 37945,
                'end': 138954
              },
              'value': 0.25
            },
            {
              'filter': {
                'type': 'range',
                'start': 138954,
                'end': 616990
              },
              'value': 0.5
            },
            {
              'filter': {
                'type': 'range',
                'start': 616990,
                'end': 2544000
              },
              'value': 0.75
            },
            {
              'filter': {
                'type': 'range',
                'start': 2544000,
                'end': 35676000
              },
              'value': 1
            }
          ],
          'stats': {
            'filter_avg': 322717.4763725758
          }
        }
      ];
      var metadataList = metadataParser.getMetadataFromRules(rules);

      expect(metadataList).toBeDefined();

      expect(metadataList[0].getType()).toBe('buckets');
      expect(metadataList[0].getColumn()).toBe('scalerank');
      expect(metadataList[0].getMapping()).toBe('>');
      expect(metadataList[0].getProperty()).toBe('marker-width');
      expect(metadataList[0].getAverage()).toBe(6.642174269325321);
      expect(metadataList[0].getMin()).toBe(0);
      expect(metadataList[0].getMax()).toBe(10);
      expect(metadataList[0].getBuckets()).toEqual([
        { min: 0, max: 6, value: 5 },
        { min: 6, max: 7, value: 10 },
        { min: 7, max: 7, value: 15 },
        { min: 7, max: 10, value: 20 }
      ]);

      expect(metadataList[0].getType()).toBe('buckets');
      expect(metadataList[1].getColumn()).toBe('pop_max');
      expect(metadataList[1].getMapping()).toBe('>');
      expect(metadataList[1].getProperty()).toBe('marker-fill-opacity');
      expect(metadataList[1].getAverage()).toBe(322717.4763725758);
      expect(metadataList[1].getMin()).toBe(-99);
      expect(metadataList[1].getMax()).toBe(35676000);
      expect(metadataList[1].getBuckets()).toEqual([
        { min: -99, max: 37945, value: 0 },
        { min: 37945, max: 138954, value: 0.25 },
        { min: 138954, max: 616990, value: 0.5 },
        { min: 616990, max: 2544000, value: 0.75 },
        { min: 2544000, max: 35676000, value: 1 }
      ]);
    });

    it('should parse correctly the category rules', function () {
      // From:
      // marker-fill: ramp([scalerank], (#5F4690, #1D6996, #38A6A5, #666666), (7, 6, 10), '=', category);
      // marker-file: ramp([scalerank], (url('https://s3.amazonaws.com/com.cartodb.users-assets.production/maki-icons/rail-light-18.svg'), url('https://s3.amazonaws.com/com.cartodb.users-assets.production/maki-icons/park-18.svg')), (7, 10), '=');
      var rules = [
        {
          'selector': '#layer',
          'prop': 'marker-fill',
          'column': 'scalerank',
          'mapping': '=',
          'buckets': [
            {
              'filter': {
                'name': 7,
                'type': 'category'
              },
              'value': '#5F4690'
            },
            {
              'filter': {
                'name': 6,
                'type': 'category'
              },
              'value': '#1D6996'
            },
            {
              'filter': {
                'name': 10,
                'type': 'category'
              },
              'value': '#38A6A5'
            },
            {
              'filter': {
                'type': 'default'
              },
              'value': '#666666'
            }
          ],
          'stats': {}
        },
        {
          'selector': '',
          'prop': 'marker-file',
          'column': 'scalerank',
          'mapping': '=',
          'buckets': [
            {
              'filter': {
                'name': 7,
                'type': 'category'
              },
              'value': 'url(\'https://s3.amazonaws.com/com.cartodb.users-assets.production/maki-icons/rail-light-18.svg\')'
            },
            {
              'filter': {
                'name': 10,
                'type': 'category'
              },
              'value': 'url(\'https://s3.amazonaws.com/com.cartodb.users-assets.production/maki-icons/park-18.svg\')'
            }
          ],
          'stats': {}
        }
      ];
      var metadataList = metadataParser.getMetadataFromRules(rules);

      expect(metadataList).toBeDefined();

      expect(metadataList[0].getType()).toBe('categories');
      expect(metadataList[0].getColumn()).toBe('scalerank');
      expect(metadataList[0].getMapping()).toBe('=');
      expect(metadataList[0].getProperty()).toBe('marker-fill');
      expect(metadataList[0].getDefaultValue()).toBe('#666666');
      expect(metadataList[0].getCategories()).toEqual([
        { name: 7, value: '#5F4690' },
        { name: 6, value: '#1D6996' },
        { name: 10, value: '#38A6A5' }
      ]);

      expect(metadataList[0].getType()).toBe('categories');
      expect(metadataList[1].getColumn()).toBe('scalerank');
      expect(metadataList[1].getMapping()).toBe('=');
      expect(metadataList[1].getProperty()).toBe('marker-file');
      expect(metadataList[1].getDefaultValue()).not.toBeDefined();
      expect(metadataList[1].getCategories()).toEqual([
        { name: 7, value: 'url(\'https://s3.amazonaws.com/com.cartodb.users-assets.production/maki-icons/rail-light-18.svg\')' },
        { name: 10, value: 'url(\'https://s3.amazonaws.com/com.cartodb.users-assets.production/maki-icons/park-18.svg\')' }
      ]);
    });
  });
});
