describe("Share dialog", function() {

  describe("Standard user", function() {
    beforeEach(function() {

      user_data = {
        username: "dev",
        account_type: "FREE",
        actions: {
          private_maps: false
        }
      };

      this.vis = new cdb.admin.Visualization({
        map_id:           96,
        active_layer_id:  null,
        name:             "test_table",
        description:      null,
        tags:             ["jamon","probando","test"],
        privacy:          "PUBLIC",
        updated_at:       "2013-03-04T18:09:34+01:00",
        type:             "derived"
      });

      cartodb_layer = new cdb.admin.CartoDBLayer({ table_name: 'test_table' });

      this.vis.map.layers.reset([
        new cdb.geo.MapLayer({ urlTemplate: 'http://test.com' }),
        cartodb_layer
      ]);
      //this.vis.map.set('provider', 'leaflet');

      this.user = TestUtil.createUser();
      this.user.set({ account_type: "FREE", actions: { private_maps: false }});

      this.share = new cdb.admin.ShareDialog({
        vis:    this.vis,
        user:   this.user,
        config: TestUtil.config
      });
    });

    it("should render a map without the CartoDB logo control", function() {
      this.share.render();
      expect(this.share.$('li.cartodb_logo').length > 0).toBeFalsy();
    });

    it("should render the upgrade message", function() {
      this.share.render().show();
      expect(this.share.$('li.upgrade_message').length > 0).toEqual(true);
    });

    it("shouldn't show description of the visualization as null", function() {
      this.share.render();
      expect(this.share.$('div.cartodb-header p').text()).toBe('');
    });

    it("shouldn't show layer-selector if there is only one data layer", function(done) {
      this.share.render();
      var self = this;
      setTimeout(function() {
        expect(self.share.$('div.cartodb-layer-selector-box').length).toBe(1)
        expect(self.share.$('div.cartodb-layer-selector-box').is(':visible')).toBe(false)
        done()
      }, 2000);
    });

    it("should show layer-selector if there are several data layers", function(done) {
      this.vis.map.layers.reset([
        new cdb.admin.CartoDBLayer({ table_name: 'test_table', urlTemplate: 'http://test.com' }),
        new cdb.admin.CartoDBLayer({ table_name: 'test_table', urlTemplate: 'http://test.com' })
      ]);

      var share = new cdb.admin.ShareDialog({
        vis:    this.vis,
        user:   this.user,
        config: TestUtil.config
      });

      share.render();

      setTimeout(function() {
        expect(share.$('div.cartodb-layer-selector-box').css('display')).not.toBe('none')
        done();
      }, 2500)
    });

    it("shouldn't show legends if there is only one data layer", function(done) {
      this.share.render();
      var self = this;
      setTimeout(function() {
        expect(self.share.$('div.cartodb-legends').length).toBe(1);
        expect(self.share.$('div.cartodb-legends').is(':visible')).toBe(false);
        done()
      }, 400)
    });

    it("should show legends if there are several data layers", function(done) {
      this.vis.map.layers.reset([
        new cdb.admin.CartoDBLayer({ table_name: 'test_table', urlTemplate: 'http://test.com', legend: { type:'custom' } }),
        new cdb.admin.CartoDBLayer({ table_name: 'test_table', urlTemplate: 'http://test.com' })
      ]);

      var share = new cdb.admin.ShareDialog({
        vis:    this.vis,
        user:   this.user,
        config: TestUtil.config
      });

      share.render();

      setTimeout(function() {
        expect(share.$('div.cartodb-legends').length).toBe(1);
        expect(share.$('div.cartodb-legends').css('display')).toBe('block');
        done()
      }, 500)
    });

    it("should generate correctly the vizjson url", function() {
      this.share.render();
      spyOn(this.share,'_setAPIURL');
      this.share.$("a[data-method='api']").click();
      expect(this.share._setAPIURL).toHaveBeenCalled();
    });
  });

  describe("Coronelli or greater user", function() {
    beforeEach(function() {

      user_data = {
        username: "dev",
        actions: {
          private_maps: true
        }
      };

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
      this.user.set({ account_type: "Coronelli", actions: { private_maps: true, remove_logo: true }});

      this.share = new cdb.admin.ShareDialog({
        vis:    this.vis,
        user:   this.user,
        config: TestUtil.config
      });
    });

    it("shouldn't render the upgrade message", function() {
      this.share.render().show();
      expect(this.share.$('li.upgrade_message').length > 0).toBeFalsy();
    });

    it("should render a map with CartoDB logo control", function() {
      this.share.render().show();
      expect(this.share.$('li.cartodb_logo').length > 0).toEqual(true);
    });

    it("should change map elements position when cartodb-logo changes", function() {
      this.share.render().show();
      this.share.mapOptions.set({ cartodb_logo: false });
      expect(this.share.$('.cartodb-map_wrapper').hasClass('no-logo')).toBeTruthy()
    });

    it("should render a map with controls", function() {
      this.share.render().show();
      expect(this.share.$('.cartodb-zoom').length).toEqual(1);
      expect(this.share.$('div.cartodb-header h1').html()).toEqual('test_table');
      expect(this.share.$('div.cartodb-header p').html()).toEqual('Visualization description');
      expect(this.share.$('.form_switch').length).toEqual(9);
    });

    it("should set embed URL with bounds", function(done) {

      this.share.render().show();
      this.share.model.set("method", "embed");

      var url = this.share.model.get('url');
      expect(url.indexOf('title=true')).not.toEqual(-1);
      this.share.mapOptions.set({title: false});

      var url = this.share.model.get('url');
      expect(url.indexOf('title=false')).not.toEqual(-1);
      expect(url.indexOf('sql')).not.toEqual(-1);

      // wait to map is shown

      var self = this;
      setTimeout(function() {
        // change center after the map set the bounds (there is some timeout)
        self.share.map.set('zoom', 10);
        expect( self.share.model.get('url').indexOf('sw_lat')).not.toEqual(-1);
        done();
        //expect(self.share.$('.url').val().indexOf('sw_lat')).not.toEqual(-1);
      }, 1200);
    });

    it("should set embed URL with zoom and center", function(done) {

      this.share.render().show();
      this.share.model.set("method", "embed");

      var url = this.share.model.get('url');
      expect(url.indexOf('title=true')).not.toEqual(-1);
      this.share.mapOptions.set({title: false});
      var url = this.share.model.get('url');
      expect(url.indexOf('title=false')).not.toEqual(-1);
      expect(url.indexOf('sql')).not.toEqual(-1);

      // wait to map is shown
      var self = this;

      setTimeout(function() {
        self.share.map.set('zoom', 0);
        var url = self.share.model.get('url');
        expect(url.indexOf('zoom')).not.toEqual(-1);
        expect(url.indexOf('center_lat')).not.toEqual(-1);
        done();
      }, 1200);
    });

    it("should set embed URL with SQL from layer", function() {

      var sql;
      var sqlView = new cdb.admin.SQLViewData();

      sqlView.setSQL(sql='select * from charlies limit 1');
      this.vis.map.layers.last().table.useSQLView(sqlView);
      this.share.render().show();
      this.share.model.set("method", "embed");

      var url = this.share.model.get('url');
      expect(url.indexOf('sql=' + encodeURIComponent("select * from rambo"))).not.toEqual(-1);
    });


    it("should hide header when change options", function(done) {
      this.share.render().show();

      this.share.mapOptions.set({ title: false });
      this.share.mapOptions.set({ description: false });
      this.share.mapOptions.set({ shareable: false });

      setTimeout(function() {
        //(($('.cartodb-header').css('opacity') == 0) || $('.cartodb-header').css('opacity') == undefined);
        expect($('.cartodb-header').size()).toEqual(0);
        done();
      }, 1000);

    });
  });


});

