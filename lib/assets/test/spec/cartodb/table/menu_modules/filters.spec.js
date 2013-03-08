
describe("cdb.admin.mod.Filters", function() {


  var view, table;
  beforeEach(function() {
    table = TestUtil.createTable('tst');
    view = new cdb.admin.mod.Filters({
      table: table
    });
  });

  it("should manage models filter view", function() {
    var m = new cdb.admin.models.Filter({
      column: 'test',
      table: table
    });
    view.render();
    view.filters.add(m);
    expect(view.$('li').length).toEqual(1);
    m.destroy();
    expect(view.$('li').length).toEqual(0);
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

    it("should update hist", function() {
      view.render();
      //spyOn(view, '_renderHist');
      hist = [0,1,2,3,4,5,5,6,6,7,8,8];
      hist.lower = 2;
      hist.upper = 40;
      view.model._changeHist(hist);
      expect(view.$('.range').html()).toEqual('2-40');
      expect(view.$('svg').length).toEqual(1);
      expect(view.$('.bar').length).toEqual(hist.length);
    });

  });

});
