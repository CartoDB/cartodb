var Backbone = require('backbone');
var FormulaDataviewModel = require('../../../src/dataviews/formula-dataview-model.js');

describe('dataviews/formula-dataview-model', function () {
  beforeEach(function () {
    this.map = jasmine.createSpyObj('map', ['getViewBounds', 'bind', 'reload']);
    this.map.getViewBounds.and.returnValue([[1, 2], [3, 4]]);
    this.vis = new Backbone.Model();
    this.vis.reload = jasmine.createSpy('reload');

    this.layer = new Backbone.Model();
    this.layer.getDataProvider = jasmine.createSpy('getDataProvider');

    this.model = new FormulaDataviewModel({
      source: {id: 'a0'},
      operation: 'min'
    }, {
      map: this.map,
      vis: this.vis,
      analysisCollection: new Backbone.Collection(),
      layer: this.layer
    });
  });

  it('should reload map and force fetch on operation change', function () {
    this.vis.reload.calls.reset();
    this.model.set('operation', 'avg');
    expect(this.vis.reload).toHaveBeenCalledWith({ forceFetch: true, sourceId: 'a0' });
  });

  it('should reload map and force fetch on column change', function () {
    this.vis.reload.calls.reset();
    this.model.set('column', 'other_col');
    expect(this.vis.reload).toHaveBeenCalledWith({ forceFetch: true, sourceId: 'a0' });
  });
});
