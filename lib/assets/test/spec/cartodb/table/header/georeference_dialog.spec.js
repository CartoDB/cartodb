describe("georeference dialog", function() {

  var view, table, config, user;
  beforeEach(function() {
    window.config = { account_host: 'localhost:3000' };
    user = TestUtil.createUser();
    table = new cdb.admin.CartoDBTableMetadata({
      name: 'test',
      schema: [
        ['cartodb_id', 'number'],
        ['c1', 'number'],
        ['c2', 'number'],
        ['c3', 'number']
      ]
    });
    view = new cdb.admin.GeoreferenceDialog({
      table: table,
      geocoder: new cdb.admin.Geocoding(),
      user: user
    });
  });

  it("should render properly options list", function() {
    TestUtil.feedTable(table, 1);
    view.render();
    expect(view.$('ul.options > li').length).toBe(2);
    expect(view.$('div.geocoder_stats').length).toBe(1);
    expect(view.$('a.ok').hasClass('disabled')).toBeFalsy();    
  })

  it("should render properly a message if there is no data in the table", function() {
    view.render();
    expect(view.$('ul.options > li').length).toBe(0);
    expect(view.$('div.geocoder_stats').length).toBe(0);
    expect(view.$('a.ok').hasClass('disabled')).toBeTruthy();
    expect(view.$el.find('div.content p').html()).toBe('It looks like there is no data on your table and therefore there is nothing to georeference. Please add some data and come back to georeference it.');
  })

  it("should not let the user georeference if the table is empty", function() {
    view.render();
    expect(view.$('.ok').is('.disabled')).toBeTruthy;
  })

  it("should not render table columns in lat,lon selector if the table is empty", function() {
    view.render();
    expect(view.$('#lat').length).toEqual(0);
    expect(view.$('#lon').length).toEqual(0);
  });

  it("should render table columns in lat,lon selector if the table has contents", function() {
    TestUtil.feedTable(table, 1);
    view.render();
    expect(view.$('#lat option').length).toEqual(3);
    expect(view.$('#lon option').length).toEqual(3);
  });

  it("should georeference if we have filled address input", function() {
    TestUtil.feedTable(table, 1);
    view.render();

    spyOn(view, "_hideError");

    view.model.set('option',1);
    view.$el.find(".address input.column_autocomplete").val("New York");
    view._ok();

    expect(view._hideError).toHaveBeenCalled();
    expect(view.$el.find('.address input.column_autocomplete').val()).toEqual("New York");
    expect(view.options.geocoder.get('formatter')).toBe('New York');
  });

  it("should not georeference if we have NOT filled address input", function() {
    TestUtil.feedTable(table, 1);
    view.render();
    spyOn(view, "_showError");
    view.model.set('option',1);
    view._ok();
    expect(view._showError).toHaveBeenCalled();
    expect(view.$el.css('display')).not.toBe('none');
    expect(view.options.geocoder.get('formatter')).toBe(undefined);
  });

  it("should change the view model when clicks over other option", function() {
    TestUtil.feedTable(table, 1);
    view.render();
    view.$('ul.options > li:eq(1) > a').click();
    expect(view.$('ul.options > li:eq(1) > a').hasClass('selected')).toBeTruthy();
    expect(view.$('ul.options > li:eq(1)').hasClass('active')).toBeTruthy();
  });

  it("shouldn't geocode when user don't have enough rights", function() {
    var a = _.clone(user.get('geocoding'));
    a.hard_limit = true;
    a.monthly_use = 5000;
    user.set('geocoding', a);
    TestUtil.feedTable(table, 1);
    spyOn(view,'hide');
    view.render();
    view.$('ul.options > li:eq(1) > a').click();
    expect(view.$('a.ok').hasClass('disabled')).toBeTruthy();
    view.$('a.ok').click();
    expect(view.options.geocoder.get('formatter')).toBe(undefined);
    expect(view.hide).not.toHaveBeenCalled();
  });
});
