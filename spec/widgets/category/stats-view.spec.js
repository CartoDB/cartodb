var cdb = require('cartodb.js');
var CategoryWidgetModel = require('../../../src/widgets/category/category-widget-model');
var StatsView = require('../../../src/widgets/category/stats/stats-view');

describe('widgets/category/stats-view', function () {
  beforeEach(function () {
    var vis = cdb.createVis(document.createElement('div'), {
      layers: [{type: 'torque'}]
    });
    this.model = vis.dataviews.createCategoryDataview(vis.map.layers.first(), {});
    this.viewModel = new CategoryWidgetModel({}, {
      dataviewModel: this.model
    });
    this.view = new StatsView({
      viewModel: this.viewModel,
      dataModel: this.model
    });
  });

  describe('render', function () {
    it('should render properly data stats', function () {
      this.view.render();
      expect(this.view.$('.CDB-Widget-infoItem').length).toBe(2);
    });

    it('should say "of total" words when it is rendered', function () {
      this.model._data.reset([
        { name: 'ES', agg: false, value: 2 },
        { name: 'FR', agg: false, value: 2 },
        { name: 'Other', agg: true, value: 1 }
      ]);
      this.view.render();
      expect(this.view.$('.CDB-Widget-infoItem:eq(1)').text()).toContain('% of total');
    });

    describe('search', function () {
      it('should show number of results when a search is applied', function () {
        spyOn(this.viewModel, 'isSearchEnabled').and.returnValue(true);
        spyOn(this.model, 'isSearchApplied').and.returnValue(true);
        spyOn(this.model, 'getSearchCount').and.returnValue(10);
        this.view.render();
        expect(this.view.$('.CDB-Widget-infoItem').length).toBe(1);
        expect(this.view.$('.CDB-Widget-infoItem').text()).toContain('10 found');
      });

      it('should nothing when search is enabled but not applied', function () {
        spyOn(this.viewModel, 'isSearchEnabled').and.returnValue(true);
        spyOn(this.model, 'isSearchApplied').and.returnValue(false);
        this.view.render();
        expect(this.view.$('.CDB-Widget-infoItem').length).toBe(1);
        expect(this.view.$('.CDB-Widget-infoItem').text()).not.toContain('found');
      });
    });
  });

  describe('bind', function () {
    beforeEach(function () {
      spyOn(this.model, 'bind');
      spyOn(this.viewModel, 'bind');
      this.view._initBinds();
    });

    it('should render when any of this events are triggered from data model', function () {
      var bind = this.model.bind.calls.argsFor(0);
      expect(bind[0]).toContain('change:data');
      expect(bind[0]).toContain('change:totalCount');
      expect(bind[1]).toEqual(this.view.render);
    });

    it('should render when search or locked is enabled/disabled', function () {
      var bind = this.viewModel.bind.calls.argsFor(0);
      expect(bind[0]).toContain('change:search');
      expect(bind[0]).toContain('change:locked');
      expect(bind[1]).toEqual(this.view.render);
    });
  });
});
