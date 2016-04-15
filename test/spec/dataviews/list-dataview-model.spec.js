var ListDataviewModel = require('../../../src/dataviews/list-dataview-model.js');

describe('dataviews/list-dataview-model', function () {
  beforeEach(function () {
    this.map = jasmine.createSpyObj('map', ['getViewBounds', 'bind', 'reload']);
    this.map.getViewBounds.and.returnValue([[1, 2], [3, 4]]);
    this.model = new ListDataviewModel({
    }, {
      map: this.map,
      layer: jasmine.createSpyObj('layer', ['get', 'getDataProvider'])
    });
  });

  it('should reload map and force fetch on columns change', function () {
    this.map.reload.calls.reset();
    this.model.set('columns', ['asd']);
    expect(this.map.reload).toHaveBeenCalledWith({ forceFetch: true, sourceLayerId: undefined });
  });
});
