describe("Share dialog", function() {

  describe("Free user", function() {
    beforeEach(function() {
      this.vis = new cdb.admin.Visualization({
        map_id:           96,
        active_layer_id:  null,
        name:             "test_table",
        description:      "Visualization description",
        tags:             ["jamon","probando","test"],
        privacy:          "PUBLIC",
        updated_at:       "2013-03-04T18:09:34+01:00",
        type:             "derived"
      });

      cartodb_layer = new cdb.admin.CartoDBLayer({ table_name: 'test_table'});

      this.vis.map.layers.reset([
        new cdb.geo.MapLayer(),
        cartodb_layer
      ]);

      this.user = TestUtil.createUser();

      this.share = new cdb.admin.ShareMapDialog({
        vis:    this.vis,
        user:   this.user,
        config: TestUtil.config
      });
    });

    it("should render a map without the CartoDB logo control", function() {
      this.share.render();
      expect(this.share.$('li.cartodb_logo').length > 0).toBeFalsy();
    });
  });

  describe("Coronelli user", function() {
    beforeEach(function() {
      this.vis = new cdb.admin.Visualization({
        map_id:           96,
        active_layer_id:  null,
        name:             "test_table",
        description:      "Visualization description",
        tags:             ["jamon","probando","test"],
        privacy:          "PUBLIC",
        updated_at:       "2013-03-04T18:09:34+01:00",
        type:             "derived"
      });

      this.vis.map.setBounds([[1,2], [3,4]]);

      this.vis.map.layers.reset([
        new cdb.geo.TileLayer({urlTemplate: 'http://test.com'}),
        new cdb.admin.CartoDBLayer({cartodb_logo: 'false', query: 'select * from rambo', table_name: 'test', user_name: 'test', tile_style:'.'} )
      ]);

      this.user = TestUtil.createUser();
      this.user.set({actions: { remove_logo: true }});

      this.share = new cdb.admin.ShareMapDialog({
        vis:    this.vis,
        user:   this.user,
        config: TestUtil.config
      });
    });

    it("should render a map with CartoDB logo control", function() {
      this.share.render().show();
      expect(this.share.$('li.cartodb_logo').length > 0).toEqual(true);
    });

    it("should render a map with the CartoDB logo", function() {
      this.share.render().show();

      // Map needs 300 miliseconds to be rendered
      waits(1000);

      runs(function(){
        expect(this.share.mapView.$('div.cartodb-logo').length > 0).toEqual(true);
      });
    });

    it("should render a map with controls", function() {
      this.share.render().show();
      expect(this.share.$('.cartodb-zoom').length).toEqual(1);
      expect(this.share.$('div.cartodb-header h1').html()).toEqual('test_table');
      expect(this.share.$('div.cartodb-header p').html()).toEqual('Visualization description');
      expect(this.share.$('.form_switch').length).toEqual(7); // With cartodb_logo there are 7
    });

    it("should set embed URL with bounds", function() {

      this.share.render().show();
      this.share.model.set("method", "embed");

      expect(this.share.$('.url').val().indexOf('title=true')).not.toEqual(-1);
      this.share.mapOptions.set({title: false});

      expect(this.share.$('.url').val().indexOf('title=false')).not.toEqual(-1);
      expect(this.share.$('.url').val().indexOf('sql')).not.toEqual(-1);

      // wait to map is shown
      waits(1200);

      runs(function() {
        // change center after the map set the bounds (there is some timeout)
        this.share.map.set('zoom', 10);
        expect(this.share.$('.url').val().indexOf('sw_lat')).not.toEqual(-1);
      });
    });

    it("should set embed URL with zoom and center", function() {

      this.share.render().show();
      this.share.model.set("method", "embed");

      expect(this.share.$('.url').val().indexOf('title=true')).not.toEqual(-1);
      this.share.mapOptions.set({title: false});
      expect(this.share.$('.url').val().indexOf('title=false')).not.toEqual(-1);
      expect(this.share.$('.url').val().indexOf('sql')).not.toEqual(-1);

      // wait to map is shown
      waits(1200);

      runs(function() {
        this.share.map.set('zoom', 0);
        expect(this.share.$('.url').val().indexOf('zoom')).not.toEqual(-1);
        expect(this.share.$('.url').val().indexOf('center_lat')).not.toEqual(-1);
      });
    });

    it("should set embed URL with SQL from layer", function() {

      var sql;
      var sqlView = new cdb.admin.SQLViewData();

      sqlView.setSQL(sql='select * from charlies limit 1');
      this.vis.map.layers.last().table.useSQLView(sqlView);
      this.share.render().show();
      this.share.model.set("method", "embed");

      expect(this.share.$('.url').val().indexOf('sql=' + encodeURIComponent("select * from rambo"))).not.toEqual(-1);
    });


    it("should hide header when change options", function() {
      this.share.render().show();

      this.share.mapOptions.set({ title: false });
      this.share.mapOptions.set({ description: false });
      this.share.mapOptions.set({ shareable: false });

      waitsFor(function() {
        return (($('.cartodb-header').css('opacity') == 0) || $('.cartodb-header').css('opacity') == undefined);
      }, "The element won't ever be hidden", 10000);

      runs(function () {
        expect($('.cartodb-header').size()).toEqual(0);
      });
    });
  });


});

