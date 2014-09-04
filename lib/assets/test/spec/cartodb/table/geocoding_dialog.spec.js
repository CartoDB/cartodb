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

    // Create a new geocoding dialog
    // var new_dialog = new cdb.admin.GeocodingDialog({
    //   table:  table,
    //   user:   user,
    //   data:   { longitude: 'test' }
    // });

    // new_dialog.render();
    
    // setTimeout(function() {
    //   expect(new_dialog.$('.longitude .select2-choice > span').text()).toBe('test');
    //   expect(new_dialog.$('.latitude .select2-choice > span').text()).toBe('Select the column(s)');
    //   done();
    // },120)
    
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



});
