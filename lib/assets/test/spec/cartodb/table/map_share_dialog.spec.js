
describe("", function() {

  describe("sharemapdialog", function() {
    var view;
    beforeEach(function() {
      var map = new cdb.admin.Map();
      map.setBounds([1,2], [3,4]);
      var table = TestUtil.createTable('test');
      map.layers.add(new cdb.geo.MapLayer());
      map.layers.add(new cdb.geo.CartoDBLayer({ query: 'select * from rambo'} ));
      view = new cdb.admin.ShareMapDialog({
        map: map,
        table: table,
        user: {account_type: "FREE"}
      });
    });

    it("should render 3 panels", function() {
      view.render();
      expect(_.keys(view.panels._subviews).length).toEqual(3);
    });

  });

  describe("sharemap", function() {
    var view, table, map;
    beforeEach(function() {
      map = new cdb.admin.Map();
      map.setBounds([[1,2], [3,4]]);
      map.layers.add(new cdb.geo.TileLayer({ urlTemplate: 'http://test.com'}));
      map.layers.add(new cdb.geo.CartoDBLayer({cartodb_logo: 'false', query: 'select * from rambo', table_name: 'test', user_name: 'test'} ));
      table = TestUtil.createTable('test');

      mapOptions = new cdb.core.Model({
        title: true,
        description: true,
        search: false,
        shareable: false,
        sql: ''
      });

      view = new cdb._test.MapShareTab({
        map: map,
        table: table,
        user: {account_type: "CORONELLI"},
        mapOptions: mapOptions
      });

      config = {custom_com_hosted: false};
    });

    it("should render a map with cartodb logo control", function() {
      view.render().show();
      expect(view.$('li.cartodb_logo').length > 0).toEqual(true);
    }); 

    it("should render a map with the cartodb logo", function() {
      runs(function() {
        view.render().show();
        view.activated();
      })

      // Map needs 300 miliseconds to be rendered
      waits(301);

      runs(function(){
        expect(view.mapView.$('a.cartodb_logo').length > 0).toEqual(true);
      });
    }); 

    it("should render a map with controls", function() {
      view.render().show();
      expect(view.$('div.cartodb-zoom').length).toEqual(1);
      expect(view.$('div.cartodb-header h1').html()).toEqual('test');
      expect(view.$('div.cartodb-header p').html()).toEqual('test description');
      expect(view.$('.form_switch').length).toEqual(5); // With cartodb_logo there are 5
    });

    it("should set url with bounds", function() {
      runs(function() {
        view.render().show();
        expect(view.$('.url').val().indexOf('title=true')).not.toEqual(-1);
        view.mapOptions.set({title: false});
        expect(view.$('.url').val().indexOf('title=false')).not.toEqual(-1);
        expect(view.$('.url').val().indexOf('sql')).not.toEqual(-1);
      });
      // wait to map is shown
      waits(1200);

      runs(function() {
        // change center after the map set the bounds (there is some timeout)
        view.map.set('zoom', 10);
        expect(view.$('.url').val().indexOf('sw_lat')).not.toEqual(-1);
      });
    });

    it("should set url with zoom and center", function() {
      runs(function() {
        view.render().show();
        expect(view.$('.url').val().indexOf('title=true')).not.toEqual(-1);
        view.mapOptions.set({title: false});
        expect(view.$('.url').val().indexOf('title=false')).not.toEqual(-1);
        expect(view.$('.url').val().indexOf('sql')).not.toEqual(-1);
      });
      // wait to map is shown
      waits(1200);

      runs(function() {
        view.map.set('zoom', 0);
        expect(view.$('.url').val().indexOf('zoom')).not.toEqual(-1);
        expect(view.$('.url').val().indexOf('center_lat')).not.toEqual(-1);
      });
    });

    it("should set url with sql from layer", function() {
      var sql;
      var sqlView = new cdb.admin.SQLViewData();
      sqlView.setSQL(sql='select * from charlies limit 1');
      table.useSQLView(sqlView);
      view.render().show();
      expect(view.$('.url').val().indexOf('sql=' + encodeURIComponent("select * from rambo"))).not.toEqual(-1);
    });


    it("should hide header when change options", function() {
      view.render().show();
      view.mapOptions.set({title: false});
      view.mapOptions.set({description: false});
      view.mapOptions.set({shareable: false});
      expect(view.$('div.cartodb-header').css('display')).toEqual('none');
    });
  });

});
