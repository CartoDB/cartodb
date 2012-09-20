
describe("", function() {

  describe("sharemapdialog", function() {
    var view;
    beforeEach(function() {
      var map = new cdb.admin.Map();
      var table = TestUtil.createTable('test');
      map.layers.add(new cdb.geo.MapLayer());
      map.layers.add(new cdb.geo.MapLayer());
      view = new cdb.admin.ShareMapDialog({
        map: map,
        table: table
      });
    });

    it("should render 3 panels", function() {
      view.render();
      expect(_.keys(view.panels._subviews).length).toEqual(3);
    });

  });

  describe("sharemap", function() {
    var view, table;
    beforeEach(function() {
      var map = new cdb.admin.Map();
      table = TestUtil.createTable('test');
      view = new cdb._test.MapShareTab({
        map: map,
        table: table
      });

    });

    it("should render a map with controls", function() {
      view.render().show();
      expect(view.$('#zoom').length).toEqual(1);
      expect(view.$('div.header h1').html()).toEqual('test');
      expect(view.$('div.header p').html()).toEqual('test description');
      expect(view.$('.form_switch').length).toEqual(5);
    });

    it("should set url", function() {
      runs(function() {
        view.render().show();
        expect(view.$('.url').html().indexOf('title=true')).not.toEqual(-1);
        view.mapOptions.set({title: false});
        expect(view.$('.url').html().indexOf('title=false')).not.toEqual(-1);
        expect(view.$('.url').html().indexOf('sql')).not.toEqual(-1);
      });
      // wait to map is shown
      waits(1200);

      runs(function() {
        expect(view.$('.url').html().indexOf('sw_lat')).not.toEqual(-1);
      });
    });

    it("should set url with sql", function() {
      var sql;
      var sqlView = new cdb.admin.SQLViewData();
      sqlView.setSQL(sql='select * from rambo limit 1');
      table.useSQLView(sqlView);
      view.render().show();
      expect(view.$('.url').html().indexOf('sql=' + encodeURIComponent(sql))).not.toEqual(-1);
    });

    it("should hide header when change options", function() {
      view.render().show();
      view.mapOptions.set({title: false});
      view.mapOptions.set({description: false});
      view.mapOptions.set({shareable: false});
      expect(view.$('div.header').css('display')).toEqual('none');
    });
  });

});
