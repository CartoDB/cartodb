var Model = require('../../../src/core/model');
var HistogramDataviewModel = require('../../../src/dataviews/histogram-dataview-model');

describe('dataviews/histogram-dataview-model', function () {
  beforeEach(function () {
    this.map = jasmine.createSpyObj('map', ['getViewBounds', 'bind', 'reload']);
    this.map.getViewBounds.and.returnValue([[1, 2], [3, 4]]);
    var windshaftMap = jasmine.createSpyObj('windhsaftMap', ['bind']);
    this.filter = new Model();
    this.layer = new Model();
    this.model = new HistogramDataviewModel({}, {
      map: this.map,
      windshaftMap: windshaftMap,
      layer: this.layer,
      filter: this.filter
    });
  });

  it('should reload map on changing attrs', function () {
    this.map.reload.calls.reset();
    this.model.set('column', 'random_col');
    expect(this.map.reload).toHaveBeenCalled();
  });

  it('should refresh data on bins change', function () {
    this.map.reload.calls.reset();
    spyOn(this.model, 'fetch');
    this.model.set('bins', 123);
    expect(this.map.reload).not.toHaveBeenCalled();
    expect(this.model.fetch).toHaveBeenCalled();
  });

  it('should include the bbox after the first fetch', function () {
    this.model.set('url', 'http://example.com', { silent: true });
    this.model.set('boundingBox', 'fakeBoundingBox');
    spyOn(this.model, 'sync').and.callFake(function (args) {
      this.model.set('data', 'something');
    }.bind(this));

    // url doesn't include bbox the first time
    expect(this.model.url()).toEqual('http://example.com?bins=10');

    this.model.fetch();

    // url now has the bbox
    expect(this.model.url()).toEqual('http://example.com?bins=10&bbox=fakeBoundingBox');
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
      expect(this.model.filter.get('column_type')).not.toEqual('date');
      this.model.layer.set({
        meta: {
          column_type: 'date'
        }
      });
    });

    it('should change the filter column_type', function () {
      expect(this.model.filter.get('column_type')).toEqual('date');
    });
  });
});
