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
    expect(dialog.$('.create-tab').length).toBe(7);
    expect(dialog.$('.create-tab > .latlng').hasClass('selected')).toBeTruthy();
  });


  describe("Latitude Longitude pane", function() {

    afterEach(function() {
      // dialog.clean();
    });

    beforeEach(function() {

      // user = TestUtil.createUser('test');
      // table = TestUtil.createTable('test');

      // // Create a new geocoding dialog
      // dialog = new cdb.admin.GeocodingDialog({
      //   table:  table,
      //   user:   user
      // });
    });

    it("should render latitude and longitude combos", function() {
      // dialog.render();
      // expect(dialog.$('.create-tab').length).toBe(7);
      // expect(dialog.$('.create-tab > .latlng').hasClass('selected')).toBeTruthy();
    });    

  });  

});
