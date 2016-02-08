var FormulaDataviewModel = require('../../../src/dataviews/formula-dataview-model.js');

describe('dataviews/formula-dataview-model', function () {
  beforeEach(function () {
    this.map = jasmine.createSpyObj('map', ['getViewBounds', 'bind', 'reload']);
    this.map.getViewBounds.and.returnValue([[1, 2], [3, 4]]);
    var windshaftMap = jasmine.createSpyObj('windshaftMap', ['bind']);
    this.model = new FormulaDataviewModel({
      operation: 'min'
    }, {
      map: this.map,
      windshaftMap: windshaftMap,
      layer: jasmine.createSpyObj('layer', ['get', 'getDataProvider'])
    });
  });

  it('should reload map on operation change', function () {
    this.map.reload.calls.reset()
    this.model.set('operation', 'avg');
    expect(this.map.reload).toHaveBeenCalled();
  });

  it('should reload map on column change', function () {
    this.map.reload.calls.reset()
    this.model.set('column', 'other_col');
    expect(this.map.reload).toHaveBeenCalled();
  });

  it('should reload map on prefix change', function () {
    this.map.reload.calls.reset()
    this.model.set('prefix', '$');
    expect(this.map.reload).toHaveBeenCalled();
  });

  it('should reload map on suffix change', function () {
    this.map.reload.calls.reset()
    this.model.set('suffix', '€');
    expect(this.map.reload).toHaveBeenCalled();
  });
});
