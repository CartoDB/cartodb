var Backbone = require('backbone');
var FormulaDataviewModel = require('../../../src/dataviews/formula-dataview-model.js');
var MockFactory = require('../../helpers/mockFactory');

describe('dataviews/formula-dataview-model', function () {
  var engineMock;
  beforeEach(function () {
    this.map = jasmine.createSpyObj('map', ['getViewBounds', 'bind', 'reload']);
    this.map.getViewBounds.and.returnValue([[1, 2], [3, 4]]);
    engineMock = new Backbone.Model();
    engineMock.reload = jasmine.createSpy('reload');

    this.layer = new Backbone.Model();

    this.source = MockFactory.createAnalysisModel({ id: 'a0' });

    this.model = new FormulaDataviewModel({
      source: this.source,
      operation: 'min'
    }, {
      map: this.map,
      engine: engineMock,
      layer: this.layer
    });
  });

  it('should reload map and force fetch on operation change', function () {
    engineMock.reload.calls.reset();
    this.model.set('operation', 'avg');
    expect(engineMock.reload).toHaveBeenCalledWith({ forceFetch: true, sourceId: 'a0' });
  });

  it('should reload map and force fetch on column change', function () {
    engineMock.reload.calls.reset();
    this.model.set('column', 'other_col');
    expect(engineMock.reload).toHaveBeenCalledWith({ forceFetch: true, sourceId: 'a0' });
  });
});
