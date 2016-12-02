var RangeFilter = require('../../../../src/windshaft/filters/range');

describe('windshaft/filters/range', function () {
  var rangeFilter;

  beforeEach(function () {
    rangeFilter = new RangeFilter({
      column_type: 'number',
      dataviewId: 'dataview-001'
    });
    rangeFilter.setRange(1, 20);

    spyOn(rangeFilter, 'unsetRange').and.callThrough();
  });

  it('remove', function () {
    rangeFilter.remove();

    expect(rangeFilter.unsetRange).toHaveBeenCalled();

    var json = rangeFilter.toJSON()['dataview-001'];
    expect(json.min).toBeFalsy();
    expect(json.max).toBeFalsy();
  });
});
