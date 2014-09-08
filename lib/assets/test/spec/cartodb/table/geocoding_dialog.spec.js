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


  it("should send a mixpanel event when any geocoding is selected", function() {
    var sent = false;
    dialog.render();
  
    cdb.god.bind('mixpanel', function() { sent = true });

    dialog.$('.create-tab.lonlat').click();
    dialog.$('select.longitude')
      .val('test')
      .trigger('change');

    dialog.$('select.latitude')
      .val('test')
      .trigger('change');

    dialog.$('.geocoding-pane-lonlat .ok').click();
    expect(dialog.$('.geocoding-pane-lonlat .ok').hasClass('disabled')).toBeFalsy();
    expect(sent).toBeTruthy();
  });

  it("should clean sent data when World is selected as country_code", function() {
    var data = {};
    dialog.bind('geocodingChosen', function(obj) { data = obj })

    dialog.model.set({
      geocoding: {
        country_code: 'World',
        kind: 'admin1',
        column_name: 'test',
        valid: true
      },
      option: 'admin'
    });

    dialog._onGeocodingChosen();

    expect(data.kind).toBe('admin0');
    expect(data['country_code']).not.toBeDefined();
    expect(data.table_name).toBe('test');
  });

  it("should not have leaks", function() {
    expect(dialog).toHaveNoLeaks();
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

    var pane, table, user, contries_data;

    afterEach(function() {
      pane.clean();
    });

    beforeEach(function() {
      user = TestUtil.createUser('test');
      table = TestUtil.createTable('test');
      countries_data = new cdb.admin.GeocodingDialog.Content.CountriesData([{
        country:    "Spain",
        admin1:     ['polygon'],
        postalcode: ['point'],
        namedplace: ['point']
      }]);

      pane = new cdb.admin.GeocodingDialog.Pane.DefaultGeocoder({
        table:          table,
        countries_data: countries_data,
        kind:           "namedplace"
      });
    });

    it("should render default geocoder view", function() {
      pane.render();
      expect(pane.$('.geocoding-pane-options .select2-container').length).toBe(2);
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

    it("should display error when any of the combos are not filled", function(done) {
      pane.render();
      
      pane.model.set('column_name', 'test');
      pane.$('.ok').click();
      
      setTimeout(function() {
        expect(pane.model.get('step')).toBe(0);
        expect(pane.$('.infobox .error').css('display')).toBe('block');
        done();
      },100);
    });

    it("shouldn't go to next step when error when any of the combos are not filled", function() {
      pane.render();

      pane.$('.ok').click();
      
      expect(pane.model.get('step')).toBe(0);
      expect(pane.$('.infobox .error').css('display')).toBe('block');
        
      pane.model.set('column_name', 'test');
      pane.$('.ok').click();
        
      expect(pane.model.get('step')).toBe(0);
      expect(pane.$('.infobox .error').css('display')).toBe('block');

      pane.model.set('country_code', 'Spain');
      pane.$('.ok').click();
        
      expect(pane.model.get('step')).toBe(1);
      expect(pane.$('.infobox .error').hasClass('active')).toBeFalsy();
    });


    it("should show next step when first combos are filled", function(done) {
      pane.render();

      expect(pane.model.get('geometry_type')).toBe("");
      expect(pane.$('.ok').hasClass('disabled')).toBeTruthy();

      pane.model.set({
        column_name: 'test',
        country_code: 'Spain'
      });

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
        step: 1,
        column_name: 'test',
        country_code: 'Spain',
        geometry_type: 'point'
      })

      pane.$('.back').click();
      
      expect(pane.model.get('step')).toBe(0);
      expect(pane.model.get('geometry_type')).toBe("");
    });

    it("should trigger event when all attributes are set", function() {
      var sent = false;
      pane.render();
      
      pane.bind('geocodingChosen', function() {
        console.log("hello?");
        sent = true;
      });

      pane.model.set({
        step: 1,
        column_name: 'test',
        country_code: 'Spain',
        geometry_type: 'point'
      });
      
      expect(pane.$('.ok').hasClass('disabled')).toBeFalsy();
      pane.$('.ok').click();
      expect(sent).toBeTruthy();
    });

    it("should not have leaks", function() {
      expect(pane).toHaveNoLeaks();
    });


    // Styles -> point or polygon
    describe("Styles (point or polygon?)", function() {

      var pane, model, contries_data;

      afterEach(function() {
        pane.clean();
      });

      beforeEach(function() {
        model = new cdb.admin.GeocodingDialog.Pane.Model({
          valid:          false,
          column_name:    "test",
          country_code:   "Spain",
          geometry_type:  "",
          kind:           "postalcode",
          step:           1
        });

        countries_data = new cdb.admin.GeocodingDialog.Content.CountriesData([{
          country:    "Spain",
          admin1:     ['polygon'],
          postalcode: ['point'],
          namedplace: ['point']
        }]);

        pane = new cdb.admin.GeocodingDialog.Content.Styles({
          model:          model,
          countries_data: countries_data
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
        countries_data.reset([{
          country:    "Spain",
          admin1:     ['polygon'],
          postalcode: ['polygon'],
          namedplace: ['point']
        }]);

        pane.render();
        
        expect(pane.$('li.point').hasClass('disabled')).toBeTruthy();
        expect(pane.$('li.polygon').hasClass('disabled')).toBeFalsy();
        expect(pane.$('li.point div.warning').length).toBe(1);
        expect(pane.$('li.point em').length).toBe(0); // When point is disabled, it doesn't have any tooltip
      });

      it("should set first available geometry type when step changes", function() {
        model.set({
          country_code:   "",
          column_name:    "",
          geometry_type:  "",
          step:           0
        });

        expect(pane.$('li.point').hasClass('disabled')).toBeTruthy();
        expect(pane.$('li.polygon').hasClass('disabled')).toBeTruthy();

        // Set new view step
        model.set({
          country_code: "Spain",
          column_name: "test",
          step: 1
        });

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

    var pane, user, table;

    afterEach(function() {
      pane.clean();
    });

    beforeEach(function() {
      user = TestUtil.createUser('test');
      table = TestUtil.createTable('test');

      // Create a new geocoding dialog
      pane = new cdb.admin.GeocodingDialog.Pane.Address({
        table:  table,
        user:   user
      });
    });

    it("should render address pane", function() {
      // dialog.render();
      // expect(dialog.$('.create-tab').length).toBe(6);
      // expect(dialog.$('.create-tab > .lonlat').hasClass('selected')).toBeTruthy();
    });

    it("should not have leaks", function() {
      expect(pane).toHaveNoLeaks();
    });

  });

});
