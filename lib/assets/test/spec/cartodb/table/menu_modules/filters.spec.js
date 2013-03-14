
describe("cdb.admin.mod.Filters", function() {


  var view, table, filter;
  beforeEach(function() {
    table = TestUtil.createTable('tst');
    view = new cdb.admin.mod.Filters({
      table: table,
      dataLayer: new cdb.admin.CartoDBLayer({
        name: 'test'
      }),
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
    view.render();
    view.filters.add(filter);
    expect(view.$('li').length).toEqual(1);
    filter.destroy();
    expect(view.$('li').length).toEqual(0);
  });

  it("should serialize filters data to layer", function() {
    view.render();
    view.filters.add(filter);
    filter.set('lower', 0)
    var f = view.options.dataLayer.get('filters');
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
      expect(view.$('.legend').html()).toEqual('test');
    });

    it("should be removed", function() {
      spyOn(model, 'destroy');
      view.render();
      view.$('a.remove').click();
      expect(model.destroy).toHaveBeenCalled();
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
      model._updateHist([ 
        { bucket: 'test', value: 10},
        { bucket: 'test2', value: 20}
      ]);
      view.render();
      expect(view.$('ul.items li').length).toEqual(2);
    });

    it("should disable/enable items", function() {
      model._updateHist([ 
        { bucket: 'test', value: 10},
        { bucket: 'test2', value: 20}
      ]);
      view.render();
      view.$('ul.items li')[0].click();
      expect(model.items.at(0).get('selected')).toEqual(false);
      expect(model.items.at(1).get('selected')).toEqual(true);
      expect($(view.$('ul.items li')[0]).hasClass('selected')).toEqual(false);
      expect($(view.$('ul.items li')[1]).hasClass('selected')).toEqual(true);
      view.$('ul.items li')[0].click();
      expect(model.items.at(0).get('selected')).toEqual(true);
      expect(model.items.at(1).get('selected')).toEqual(true);
      expect($(view.$('ul.items li')[0]).hasClass('selected')).toEqual(true);
      expect($(view.$('ul.items li')[1]).hasClass('selected')).toEqual(true);
    });


  });

});
