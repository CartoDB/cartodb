var Backbone = require('backbone');
var FormulaDataviewModel = require('../../../src/dataviews/formula-dataview-model.js');
var fakeFactory = require('../../helpers/fakeFactory');

describe('dataviews/formula-dataview-model', function () {
  beforeEach(function () {
    this.map = jasmine.createSpyObj('map', ['getViewBounds', 'bind', 'reload']);
    this.map.getViewBounds.and.returnValue([[1, 2], [3, 4]]);
    this.vis = new Backbone.Model();
    this.vis.reload = jasmine.createSpy('reload');

    this.layer = new Backbone.Model();

    this.source = fakeFactory.createAnalysisModel({ id: 'a0' });

    this.model = new FormulaDataviewModel({
      source: this.source,
      operation: 'min'
    }, {
      map: this.map,
      vis: this.vis,
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
