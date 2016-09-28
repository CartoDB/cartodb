var Backbone = require('backbone');
var ListDataviewModel = require('../../../src/dataviews/list-dataview-model.js');

describe('dataviews/list-dataview-model', function () {
  beforeEach(function () {
    this.map = jasmine.createSpyObj('map', ['getViewBounds', 'bind', 'reload']);
    this.map.getViewBounds.and.returnValue([[1, 2], [3, 4]]);
    this.vis = new Backbone.Model();
    this.vis.reload = jasmine.createSpy('reload');

    this.layer = new Backbone.Model();
    this.layer.getDataProvider = jasmine.createSpy('getDataProvider');

    this.model = new ListDataviewModel({
      source: {id: 'a0'}
    }, {
      map: this.map,
      vis: this.vis,
      analysisCollection: new Backbone.Collection(),
      layer: this.layer
    });
  });

  it('should reload map and force fetch on columns change', function () {
    this.vis.reload.calls.reset();
    this.model.set('columns', ['asd']);
    expect(this.vis.reload).toHaveBeenCalledWith({ forceFetch: true, sourceId: 'a0' });
  });
});
