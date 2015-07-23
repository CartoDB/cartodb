/**
 *  New geocoding dialog tests
 *
 */

describe("Geocoding dialog", function() {

  var dialog, user, table;

  afterEach(function() {
    dialog.clean();
  });

  beforeEach(function() {
    user = TestUtil.createUser('test');
    table = TestUtil.createTable('test');

    // Create a new geocoding dialog
    dialog = new cdb.admin.GeocodingDialog({
      table:  table,
      user:   user
    });
  });

  it("should render geocoding tabs", function() {
    dialog.render();
    expect(dialog.$('.create-tab').length).toBe(6);
    expect(dialog.$('.create-tab > .lonlat').hasClass('selected')).toBeTruthy();
  });

  it("should set longitude column in lonlat pane when is added", function(done) {

    // Create a new geocoding dialog
    var new_dialog = new cdb.admin.GeocodingDialog({
      table:  table,
      user:   user,
      data:   { longitude: 'test' }
    });

    new_dialog.render();

    setTimeout(function() {
      expect(new_dialog.$('.longitude .select2-choice > span').text()).toBe('test');
      expect(new_dialog.$('.latitude .select2-choice > span').text()).toBe('Select the column(s)');
      done();
    },120)

  });

  it("should sent world as location when that attribute is empty", function() {
    var data = {};
    cdb.god.bind('geocodingChosen', function(obj) { data = obj })

    dialog.model.set({
      geocoding: {
        location: '',
        kind: 'admin1',
        column_name: 'test',
        text: false,
        valid: true
      },
      option: 'admin'
    });

    dialog._onGeocodingChosen();

    expect(data.kind).toBe('admin0');
    expect(data.table_name).toBe('test');
    expect(data.location).toBe('world');
  });

  it("should disable/enable address pane depending geocoding attributes", function() {
    // Quota null -> disabled
    dialog.user.set({
      geocoding: { quota: null, block_price: null, monthly_use: 0, hard_limit: false }
    });
    dialog.render();
    expect(dialog.$('.create-tab.address .address').hasClass('disabled')).toBeTruthy();

    // Quota 0 and hard limit -> disabled
    dialog.user.set({
      geocoding: { quota: 0, block_price: 3, monthly_use: 100, hard_limit: true }
    });
    dialog.render();
    expect(dialog.$('.create-tab.address .address').hasClass('disabled')).toBeTruthy();

    // quota 0 but no hard limit -> enabled
    dialog.user.set({
      geocoding: { quota: 0, block_price: 3, monthly_use: 100, hard_limit: false }
    });
    dialog.render();
    expect(dialog.$('.create-tab.address .address').hasClass('disabled')).toBeFalsy();

    // Quota 0 and hard limit and google_maps enabled -> enabled
    spyOn(dialog.user, 'featureEnabled').and.callFake(function(feature){
      if (feature === "google_maps") {
        return true;
      } else {
        return false;
      }
    })
    dialog.user.set({ geocoding: { quota: 0, block_price: 3, monthly_use: 100, hard_limit: true }});
    dialog.render();
    expect(dialog.$('.create-tab.address .address').hasClass('disabled')).toBeFalsy();
  });

  it("should not have leaks", function() {
    expect(dialog).toHaveNoLeaks();
  });

  it("should not have tabs city, admin, postal, ip and address available if georef_disabled flag (feature flags) is enabled", function() {
    var feature_flags = [];
    feature_flags.push('georef_disabled');
    user.set('feature_flags', feature_flags);

    dialog.render();
    expect(dialog.$('.create-tab.city .city').hasClass('disabled')).toBeTruthy();
    expect(dialog.$('.create-tab.admin .admin').hasClass('disabled')).toBeTruthy();
    expect(dialog.$('.create-tab.postal .postal').hasClass('disabled')).toBeTruthy();
    expect(dialog.$('.create-tab.ip .ip').hasClass('disabled')).toBeTruthy();
    expect(dialog.$('.create-tab.address .address').hasClass('disabled')).toBeTruthy();
  });


  // Latitude and longitude pane
  describe("Latitude Longitude pane", function() {

    var pane, table, user;

    afterEach(function() {
      pane.clean();
    });

    beforeEach(function() {

      user = TestUtil.createUser('test');
      table = TestUtil.createTable('test');

      // Create a new geocoding dialog
      pane = new cdb.admin.GeocodingDialog.Pane.LonLat({
        table: table
      });
    });

    it("should render latitude and longitude combos", function() {
      pane.render();
      expect(pane.$('.table-column').length).toBe(2);
      expect(pane.$('.ok').length).toBe(1);
      expect(pane.$('.ok').hasClass('disabled')).toBeTruthy();
    });

    it("should change combos when model changes", function() {
      pane.render();

      expect(pane.$('.longitude .select2-choice > span').text()).toBe('Select the column(s)');
      expect(pane.$('.latitude .select2-choice > span').text()).toBe('Select the column(s)');

      pane.model.set('longitude', 'test');

      expect(pane.$('.longitude .select2-choice > span').text()).toBe('test');
      expect(pane.$('.latitude .select2-choice > span').text()).toBe('Select the column(s)');

      pane.model.set('latitude', 'test2');

      expect(pane.$('.latitude .select2-choice > span').text()).toBe('test2');
      expect(pane.$('.longitude .select2-choice > span').text()).toBe('test');
    });

    it("should not activate ok button when latitude or longitude are not selected", function() {
      pane.render();
      pane.model.set('latitude', 'test');
      expect(pane.$('.ok').hasClass('disabled')).toBeTruthy();
      pane.model.set('longitude', 'test2');
      expect(pane.$('.ok').hasClass('disabled')).toBeFalsy();
      pane.model.set('latitude', '');
      expect(pane.$('.ok').hasClass('disabled')).toBeTruthy();
    });

    it("should show error box when latitude or longitude are not selected", function(done) {
      pane.render();
      pane.model.set('latitude', 'test');
      pane.$('.ok').click();

      setTimeout(function(){
        expect(pane.$('.infobox .info.error').hasClass('active')).toBeTruthy();
        pane.model.set('longitude', 'test2');
        pane.$('.ok').click();

        setTimeout(function() {
          expect(pane.$('.infobox .info.error').hasClass('active')).toBeFalsy();
          done();
        }, 60);

      }, 60);
    });

    it("should activate ok button when latitude and longitude are selected", function() {
      pane.render();
      pane.model.set({
        longitude: 'test1',
        latitude: 'test2'
      });
      expect(pane.$('.ok').hasClass('disabled')).toBeFalsy();
    });

    it("should trigger an event when model is valid", function() {
      pane.render();
      var sent = false;
      pane.bind('geocodingChosen', function(){
        sent = true;
      })
      pane.model.set({
        longitude: 'test1',
        latitude: 'test2'
      });
      pane.$('.ok').click();
      expect(sent).toBeTruthy();
    });

    it("should not have leaks", function() {
      expect(pane).toHaveNoLeaks();
    });
  });


  // Default geocoder pane (City names, admin regions, postal codes,...)
  describe("Default geocoder pane", function() {

    var pane, table, user, available_geometries, server;

    afterEach(function() {
      pane.clean();
    });

    beforeEach(function() {
      user = TestUtil.createUser('test');
      table = TestUtil.createTable('test');

      pane = new cdb.admin.GeocodingDialog.Pane.DefaultGeocoder({
        table:          table,
        kind:           "namedplace"
      });

      server = sinon.fakeServer.create();
    });

    it("should render default geocoder view", function() {
      pane.render();
      expect(pane.$('.select2-container').length).toBe(2);
      expect(pane.$('.geocoding-pane-styles').length).toBe(1);
      expect(pane.$('.infobox').length).toBe(1);
      expect(pane.$('.ok').length).toBe(1);
      expect(pane.$('.ok').hasClass('disabled')).toBeTruthy();
    });

    it("should check and resize itself when it is selected", function() {
      pane.render();
      spyOn(pane, '_changePaneHeight');
      pane.setActive();
      expect(pane._changePaneHeight).toHaveBeenCalledWith(0);
    });

    it("should display error when column name is not filled", function(done) {
      pane.render();

      pane.model.set('column_name', '');
      pane.$('.ok').click();

      setTimeout(function() {
        expect(pane.model.get('step')).toBe(0);
        expect(pane.$('.infobox .error').css('display')).toBe('block');
        done();
      },100);
    });

    it("shouldn't go to final step when geometry type is not set", function() {
      pane.render();

      pane.$('.ok').click();

      expect(pane.model.get('step')).toBe(0);
      expect(pane.$('.infobox .error').css('display')).toBe('block');

      pane.model.set('column_name', 'test');
      pane.$('.ok').click();

      expect(pane.model.get('step')).toBe(1);
      expect(pane.$('.infobox .error').hasClass('active')).toBeFalsy();

      pane.model.set('location', 'Spain');
      server.respondWith('/api/v1/geocodings/available_geometries?kind=namedplace&column_name=Spain&table_name=test', [200, { "Content-Type": "application/json" }, '["point"]']);
      server.respond();
      pane.$('.ok').click();

      expect(pane.model.get('step')).toBe(1);
      expect(pane.$('.infobox .error').hasClass('active')).toBeFalsy();
    });


    it("should show next step when first combos are filled", function(done) {
      pane.render();

      expect(pane.model.get('geometry_type')).toBe("");
      expect(pane.$('.ok').hasClass('disabled')).toBeTruthy();

      pane.model.set({
        column_name:  'test',
        location:     'Spain',
        text:         false
      });

      server.respondWith('/api/v1/geocodings/available_geometries?kind=namedplace&column_name=Spain&table_name=test', [200, { "Content-Type": "application/json" }, '["point"]']);
      server.respond();

      expect(pane.$('.ok').hasClass('disabled')).toBeFalsy();
      pane.$('.ok').click();

      setTimeout(function() {
        expect(pane.model.get('step')).toBe(1);
        expect(pane.$('.geocoding-pane-content-wrapper').css('margin-left')).not.toBe("0px");
        expect(pane.model.get('geometry_type')).not.toBe("");
        done();
      }, 200)
    });

    it("should go to first step when back button is clicked", function() {
      pane.render();

      pane.model.set({
        step:           1,
        column_name:    'test',
        location:       'Spain',
        geometry_type:  'point'
      });

      server.respondWith('/api/v1/geocodings/available_geometries?kind=namedplace&column_name=Spain&table_name=test', [200, { "Content-Type": "application/json" }, '["point"]']);
      server.respond();

      pane.$('.back').click();

      expect(pane.model.get('step')).toBe(0);
      expect(pane.model.get('geometry_type')).toBe("");
    });

    it("should trigger event when all attributes are set", function() {
      var sent = false;
      pane.render();

      pane.bind('geocodingChosen', function() {
        sent = true;
      });

      pane.model.set({
        step: 1,
        column_name: 'test',
        location: 'Spain',
        geometry_type: 'point'
      });

      server.respondWith('/api/v1/geocodings/available_geometries?kind=namedplace&column_name=Spain&table_name=test', [200, { "Content-Type": "application/json" }, '["point"]']);
      server.respond();

      expect(pane.$('.ok').hasClass('disabled')).toBeFalsy();
      pane.$('.ok').click();
      expect(sent).toBeTruthy();
    });

    it("should get available geometries when pane is activated and location is not set", function() {
      pane.model.set({ location: '', text: false }, { silent: true });
      pane.available_geometries.unset('available_geometries');
      spyOn(pane, '_getAvailableGeometries');
      expect(pane._getAvailableGeometries.calls.count()).toBe(0);
      pane.setActive();
      expect(pane._getAvailableGeometries.calls.count()).toBe(1);

      pane.model.set({ location: '', text: false }, { silent: true });
      pane.available_geometries.set('available_geometries', []);
      pane.setActive();
      expect(pane._getAvailableGeometries.calls.count()).toBe(2);

      pane.available_geometries.set('available_geometries', ['point']);
      pane.setActive();
      expect(pane._getAvailableGeometries.calls.count()).toBe(2);
    });

    it("should not have leaks", function() {
      expect(pane).toHaveNoLeaks();
    });


    // Styles -> point or polygon
    describe("Styles (point or polygon?)", function() {

      var pane, model, available_geometries, server;

      afterEach(function() {
        pane.clean();
      });

      beforeEach(function() {
        // server = sinon.fakeServer.create();

        model = new cdb.admin.GeocodingDialog.Pane.Model({
          valid:          false,
          location:       "test",
          text:           false,
          geometry_type:  "",
          kind:           "postalcode",
          step:           1
        });

        available_geometries = new cdb.admin.GeocodingDialog.AvailableGeometries({
          available_geometries: ['point']
        });

        pane = new cdb.admin.GeocodingDialog.Content.Styles({
          model:                model,
          available_geometries: available_geometries
        });
      });

      it("should render geocoder styles view", function() {
        pane.render();
        expect(pane.$('li').length).toBe(2);
        expect(pane.$('li.point').length).toBe(1);
        expect(pane.$('li.polygon').length).toBe(1);
      });

      it("should disable polygon when country doesn't support it", function() {
        pane.render();

        expect(pane.$('li.polygon').hasClass('disabled')).toBeTruthy();
        expect(pane.$('li.point').hasClass('disabled')).toBeFalsy();
        expect(pane.$('li.polygon div.warning').length).toBe(1);
        expect(pane.$('li.polygon em').length).toBe(1);
      });

      it("should disable point when country doesn't support it", function() {
        available_geometries.set({ available_geometries: ['polygon'] });

        pane.render();

        expect(pane.$('li.point').hasClass('disabled')).toBeTruthy();
        expect(pane.$('li.polygon').hasClass('disabled')).toBeFalsy();
        expect(pane.$('li.point div.warning').length).toBe(1);
        expect(pane.$('li.point em').length).toBe(0); // When point is disabled, it doesn't have any tooltip
      });

      it("should set first available geometry type when step changes", function() {
        pane.render();

        model.set({
          location:       "",
          column_name:    "",
          geometry_type:  "",
          step:           0
        });

        available_geometries.set('available_geometries',[]);

        expect(pane.$('li.point').hasClass('disabled')).toBeTruthy();
        expect(pane.$('li.polygon').hasClass('disabled')).toBeTruthy();

        // Set new view step
        model.set({
          location:     "Spain",
          column_name:  "test"
        });

        available_geometries.set('available_geometries',['point']);

        model.set({ step: 1 })

        expect(pane.$('li.point').hasClass('disabled')).toBeFalsy();
        expect(pane.$('li.polygon').hasClass('disabled')).toBeTruthy();
        expect(model.get('geometry_type')).toBe('point');
      });

      it("should not have leaks", function() {
        expect(pane).toHaveNoLeaks();
      });

    });

  });


  // IP pane
  describe("IP pane", function() {

    var pane, table, user;

    afterEach(function() {
      pane.clean();
    });

    beforeEach(function() {

      user = TestUtil.createUser('test');
      table = TestUtil.createTable('test');

      // Create a new geocoding dialog
      pane = new cdb.admin.GeocodingDialog.Pane.IP({
        table: table
      });
    });

    it("should render ip combo", function() {
      pane.render();
      expect(pane.$('.geocoding-pane-select.ip').length).toBe(1);
      expect(pane.$('.ok').length).toBe(1);
      expect(pane.$('.ok').hasClass('disabled')).toBeTruthy();
    });

    it("should change combo when model changes", function() {
      pane.render();
      expect(pane.$('.geocoding-pane-select.ip .select2-choice > span').text()).toBe('Select the column(s)');
      pane.model.set('column_name', 'test');
      expect(pane.$('.geocoding-pane-select.ip .select2-choice > span').text()).toBe('test');
    });

    it("should activate ok button when column_name is selected", function() {
      pane.render();
      expect(pane.$('.ok').hasClass('disabled')).toBeTruthy();
      pane.model.set({
        column_name: 'test1'
      });
      expect(pane.$('.ok').hasClass('disabled')).toBeFalsy();
    });

    it("should show error box when ip combo is not selected", function(done) {
      pane.render();

      pane.$('.ok').click();

      setTimeout(function(){
        expect(pane.$('.infobox .info.error').hasClass('active')).toBeTruthy();
        pane.model.set('column_name', 'test');
        pane.$('.ok').click();

        setTimeout(function() {
          expect(pane.$('.infobox .info.error').hasClass('active')).toBeFalsy();
          done();
        }, 60);

      }, 60);
    });

    it("should trigger an event when model is valid", function() {
      pane.render();
      var sent = false;
      pane.bind('geocodingChosen', function(){
        sent = true;
      })
      pane.model.set({
        column_name: 'test1'
      });
      pane.$('.ok').click();
      expect(sent).toBeTruthy();

      sent = false;
      pane.model.set({
        column_name: ''
      });
      pane.$('.ok').click();
      expect(sent).toBeFalsy();
    });

    it("should not have leaks", function() {
      expect(pane).toHaveNoLeaks();
    });

  });


  // Address pane
  describe("Address pane", function() {

    var pane, user, table, server;

    afterEach(function() {
      pane.clean();
    });

    beforeEach(function() {
      user = TestUtil.createUser('test');
      table = TestUtil.createTable('test');
      server = sinon.fakeServer.create();

      // Create a new geocoding dialog
      pane = new cdb.admin.GeocodingDialog.Pane.Address({
        table:  table,
        user:   user
      });
    });

    it("should render address pane", function() {
      pane.render();
      expect(pane.$('.geocoding-quota').length).toBe(1);
      expect(pane.$('.geocoding-pane-content').length).toBe(1);
      expect(pane.$('.geocoding-pane-foot').length).toBe(1);
      expect(pane.$('span.loading').length).toBe(1);
    });

    it("should not render geocoding quota when google_maps is enabled", function() {
      spyOn(user,'featureEnabled').and.returnValue(true);
      pane.render();
      expect(pane.$('.geocoding-quota').length).toBe(0);
      expect(pane.$('span.loading').length).toBe(0);
      expect(pane.$('.geocoding-pane-content').length).toBe(1);
      expect(pane.$('.geocoding-pane-foot').length).toBe(1);
    });

    it("should render when estimate model is fetched", function() {
      pane.render();
      spyOn(pane, 'render').and.callThrough();
      expect(pane.$('span.loading').length).toBe(1);
      server.respondWith('/api/v1/geocodings/estimation_for/test', [200, { "Content-Type": "application/json" }, '{"rows":1000, "estimation":120}']);
      server.respond();
      expect(pane.render).toHaveBeenCalled();
      expect(pane.$('span.loading').length).toBe(0);
    });

    it("should show price and terms blocks when estimation rows is bigger than user available quota", function() {
      // 1) Estimation is bigger than your available quota
      pane.render();
      server.respondWith('/api/v1/geocodings/estimation_for/test', [200, { "Content-Type": "application/json" }, '{"rows":10000, "estimation":120}']);
      server.respond();
      expect(pane.$('span.loading').length).toBe(0);
      // We have to show the price
      expect(pane.$('.message p em').length).toBe(1);
      expect(pane.$('.geocoding-pane-terms').length).toBe(1);
    });

    it("shouldn't show price or terms blocks if user has google_maps flag enabled although estimation rows is bigger than user available quota", function() {
      // 1) Estimation is bigger than your available quota
      spyOn(user,'featureEnabled').and.returnValue(true);
      pane.render();
      server.respondWith('/api/v1/geocodings/estimation_for/test', [200, { "Content-Type": "application/json" }, '{"rows":10000, "estimation":120}']);
      server.respond();
      expect(pane.$('.message p em').length).toBe(0);
      expect(pane.$('.geocoding-pane-terms').length).toBe(0);
    });

    it("should show neither terms nor cost when estimation rows fits over user quota", function() {
      // 2) Estimation can fit in you available quota
      pane.render();
      server.respondWith('/api/v1/geocodings/estimation_for/test', [200, { "Content-Type": "application/json" }, '{"rows":10, "estimation":0}']);
      server.respond();
      expect(pane.$('span.loading').length).toBe(0);
      // We dont have to show the price
      expect(pane.$('.message p em').length).toBe(0);
      expect(pane.$('.geocoding-pane-terms').length).toBe(0);
    });

    it("should show neither terms nor cost when estimation fails and user has hard-limit", function() {
      var geocoding = pane.user.get('geocoding');
      geocoding.hard_limit = true;
      pane.user.set('geocoding', geocoding);
      // 3) Estimation fails but user doesn't have hard-limit set
      pane.render();
      server.respondWith('/api/v1/geocodings/estimation_for/test', [200, { "Content-Type": "application/json" }, '{fail}']);
      server.respond();
      expect(pane.$('span.loading').length).toBe(0);
      // We dont have to show the price
      expect(pane.$('.message p em').length).toBe(0);
      expect(pane.$('.geocoding-pane-terms').length).toBe(0);
    });

    it("should show terms, but not cost when estimation fails and user has no hard-limit", function() {
      // 4) Estimation fails but user has hard-limit set
      var geocoding = pane.user.get('geocoding');
      geocoding.hard_limit = false;
      pane.user.set('geocoding', geocoding);
      pane.render();
      server.respondWith('/api/v1/geocodings/estimation_for/test', [200, { "Content-Type": "application/json" }, '{fail}']);
      server.respond();
      expect(pane.$('span.loading').length).toBe(0);
      // We dont have to show the price
      expect(pane.$('.message p em').length).toBe(0);
      expect(pane.$('.geocoding-pane-terms').length).toBe(1);
    });

    it("should show error when formatter is not completed", function(done) {
      var sent = false;
      pane.bind('geocodingChosen', function() {
        sent = true;
      })
      pane.render();
      pane.address_model.set({ columnValue: '' });
      expect(pane.$('.ok').hasClass('disabled')).toBeTruthy();
      pane.$('.ok').click();
      setTimeout(function() {
        expect(pane.$('.infobox .error.active').length).toBe(1);
        expect(sent).toBeFalsy();
        done();
      }, 250);
    });

    it("should let add additional columns and formatter should be ok", function() {
      var sent = false;
      pane.bind('geocodingChosen', function() {
        sent = true;
      })
      pane.render();
      pane.address_model.set({ columnValue: 'testing' });
      expect(pane.$('.ok').hasClass('disabled')).toBeFalsy();
      pane.$('.ok').click();
      expect(pane.$('.infobox .error.active').length).toBe(0);
      expect(sent).toBeTruthy();
    });

    it("should create new formatter with the additional columns", function() {
      var d = {};
      pane.bind('geocodingChosen', function(data) {
        d = data;
      });
      pane.render();
      pane.address_model.set({ columnValue: 'testing' });
      pane.additional_columns.add({ columnValue: 'paco' });
      expect(pane.$('.ok').hasClass('disabled')).toBeFalsy();
      pane.$('.ok').click();
      expect(d.formatter).toBe('{testing}, {paco}');
    });

    it("should not have leaks", function() {
      expect(pane).toHaveNoLeaks();
    });

  });

});
