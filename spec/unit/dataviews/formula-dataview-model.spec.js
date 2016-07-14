var FormulaDataviewModel = require('../../../src/dataviews/formula-dataview-model.js');

describe('dataviews/formula-dataview-model', function () {
  beforeEach(function () {
    this.map = jasmine.createSpyObj('map', ['getViewBounds', 'bind', 'reload']);
    this.map.getViewBounds.and.returnValue([[1, 2], [3, 4]]);
    this.model = new FormulaDataviewModel({
      operation: 'min'
    }, {
      map: this.map,
      layer: jasmine.createSpyObj('layer', ['get', 'getDataProvider'])
    });
  });

  it('should reload map and force fetch on operation change', function () {
    this.map.reload.calls.reset();
    this.model.set('operation', 'avg');
    expect(this.map.reload).toHaveBeenCalledWith({ forceFetch: true, sourceLayerId: undefined });
  });

  it('should reload map and force fetch on column change', function () {
    this.map.reload.calls.reset();
    this.model.set('column', 'other_col');
    expect(this.map.reload).toHaveBeenCalledWith({ forceFetch: true, sourceLayerId: undefined });
  });
});
