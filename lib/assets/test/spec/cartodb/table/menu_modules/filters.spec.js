
describe("cdb.admin.Filters", function() {

  var filterView, table, filter;
  beforeEach(function() {

    table = TestUtil.createTable('tst');
    dataLayer = new cdb.admin.CartoDBLayer({ name: 'test' });
    dataLayer.sync = function() {};
    var sqlView = new cdb.admin.SQLViewData();
    dataLayer.bindSQLView(sqlView);

    filterView = new cdb.admin.mod.Filters({
      table: table,
      dataLayer: dataLayer,
      repeatInterval: -1
    });

    var m = new cdb.admin.models.Filter({
      column: 'test',
      table: table,
      lower: 1,
      upper: 10,
      column_type: 'number'
    });
    filter = m;

  });

  it("should manage models filter view", function() {
    filterView.render();
    filterView.filters.add(filter);
    expect(filterView.$('li').length).toEqual(1);
    filter.destroy();
    expect(filterView.$('li').length).toEqual(0);
  });

  it("should serialize filters data to layer", function() {
    filterView.render();
    filterView.filters.add(filter);
    filter.set('lower', 0)
    var f = filterView.options.dataLayer.get('filters');
    expect(f).toEqual([filter.toJSON()])

  });

  describe('cdb.admin.mod.Filter', function() {
    var filter, model;

    beforeEach(function() {
      model = new cdb.admin.models.Filter({
        column: 'test',
        table: table
      });
      view = new cdb.admin.mod.Filter({
        model: model
      });
    });

    it("should render", function() {
      view.render();
      expect(view.$('.legend').html()).toEqual('test:');
    });

    it("should be removed", function() {
      spyOn(model, 'destroy');
      view.render();
      view.$('a.remove').click();
      expect(model.destroy).toHaveBeenCalled();
    });

    it("should update the dropdowns", function() {

      spyOn(filterView.columnSelector, "updateData");
      spyOn(filterView.innerColumnSelector, "updateData");

      table.set({ schema:[ ['test',  'number'], ['test2', 'number'] ] });

      expect(filterView.columnSelector.updateData).toHaveBeenCalled();
      expect(filterView.innerColumnSelector.updateData).toHaveBeenCalled();

    });

    //it("should update hist", function() {

      //hist = [0,1,2,3,4,5,5,6,6,7,8,8];
      //view.model.set("hist", hist);

      //console.log(this.model.get("lower"));

      //view.render();
      //view._renderHist();

      //var bounds = {};

      //bounds.lower = 2;
      //bounds.upper = 40;

      //view.model._changeHist(hist);

      //console.log(view.$el.find(".hist").html());

      //expect(view.$('.range').html()).toEqual('2 - 40');
      //expect(view.$el.find('svg').length).toEqual(1);
      //expect(view.$('.bar').length).toEqual(hist.length);

    //});

  });

  describe('cdb.admin.mod.SelectorFilter', function() {
    var filter, model;

    beforeEach(function() {

      model = new cdb.admin.models.FilterDiscrete({
        column: 'test',
        table: table,
        column_type: 'string'
      });

      view = new cdb.admin.mod.SelectorFilter({
        model: model
      });

    });

    it("should render items", function() {

      model._updateHist({ rows: [
        { bucket: 'test', value: 10},
        { bucket: 'test2', value: 20}
      ]});

      view.render();

      expect(view.$('ul.items li').length).toEqual(2);

    });

    it("should pass the reached_limit flag to the model", function() {

      model._updateHist({ reached_limit: false, rows: [
        { bucket: 'test',  value: 10},
        { bucket: 'test2', value: 20}
      ]});

      expect(model.get("reached_limit")).toEqual(false);

    });

    it("should disable/enable items", function() {
      model._updateHist({ rows: [
        { bucket: 'test', value: 10},
        { bucket: 'test2', value: 20}
      ]});

      view.render();

      $(view.$('ul.items li')[0]).click();

      expect(model.items.at(0).get('selected')).toEqual(false);
      expect(model.items.at(1).get('selected')).toEqual(true);
      expect($(view.$('ul.items li')[0]).hasClass('selected')).toEqual(false);
      expect($(view.$('ul.items li')[1]).hasClass('selected')).toEqual(true);

      $(view.$('ul.items li')[0]).click();

      expect(model.items.at(0).get('selected')).toEqual(true);
      expect(model.items.at(1).get('selected')).toEqual(true);

      expect($(view.$('ul.items li')[0]).hasClass('selected')).toEqual(true);
      expect($(view.$('ul.items li')[1]).hasClass('selected')).toEqual(true);
    });

  });

});
