var Model = require('../../../src/core/model');
var HistogramDataviewModel = require('../../../src/dataviews/histogram-dataview-model');

describe('dataviews/histogram-dataview-model', function () {
  beforeEach(function () {
    var map = jasmine.createSpyObj('map', ['getViewBounds', 'bind', 'reload']);
    map.getViewBounds.and.returnValue([[1, 2], [3, 4]]);
    var windshaftMap = jasmine.createSpyObj('windhsaftMap', ['bind']);
    this.filter = new Model();
    this.layer = new Model();
    this.layer.getDataProvider = function () {};
    this.model = new HistogramDataviewModel({}, {
      map: map,
      windshaftMap: windshaftMap,
      layer: this.layer,
      filter: this.filter
    });
  });

  it('should submit the bbox if enabled', function () {
    this.model.set({ boundingBox: 1234 });
    expect(this.model.url()).toBe('');

    this.model.set({ submitBBox: true });
    expect(this.model.url()).toBe('?bbox=1234');
  });

  it('should parse the bins', function () {
    var data = {
      bin_width: 14490.25,
      bins: [
        { bin: 0, freq: 2, max: 70151, min: 55611 },
        { bin: 1, freq: 2, max: 79017, min: 78448 },
        { bin: 3, freq: 1, max: 113572, min: 113572 }
      ],
      bins_count: 4,
      bins_start: 55611,
      nulls: 0,
      type: 'histogram'
    };

    this.model.parse(data);

    var parsedData = this.model.getData();

    expect(data.nulls).toBe(0);
    expect(parsedData.length).toBe(4);
    expect(JSON.stringify(parsedData)).toBe('[{"bin":0,"start":55611,"end":70101.25,"freq":2,"max":70151,"min":55611},{"bin":1,"start":70101.25,"end":84591.5,"freq":2,"max":79017,"min":78448},{"bin":2,"start":84591.5,"end":99081.75,"freq":0},{"bin":3,"start":99081.75,"end":113572,"freq":1,"max":113572,"min":113572}]');
  });

  describe('when layer changes meta', function () {
    beforeEach(function () {
      expect(this.model.filter.get('columnType')).not.toEqual('date');
      this.model.layer.set({
        meta: {
          column_type: 'date'
        }
      });
    });

    it('should change the filter columnType', function () {
      expect(this.model.filter.get('columnType')).toEqual('date');
    });
  });
});
