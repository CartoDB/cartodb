describe("cdb.admin.GeoreferenceDialog", function() {

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
    expect(view.$('ul.options > li').length).toBe(3);
    expect(view.$('div.geocoder_stats').length).toBe(1);
    expect(view.$('a.next').hasClass('disabled')).toBeFalsy();
  })

  it("should render properly a message if there is no data in the table", function() {
    view.render();
    expect(view.$('ul.options > li').length).toBe(0);
    expect(view.$('div.geocoder_stats').length).toBe(0);
    expect(view.$('a.next').hasClass('disabled')).toBeTruthy();
    expect(view.$el.find('div.content p').html()).toBe('It looks like there is no data on your table and therefore there is nothing to georeference. Please, add some data and come back to georeference it.');
  })

  it("should not let the user georeference if the table is empty", function() {
    view.render();
    expect(view.$('.next').is('.disabled')).toBeTruthy;
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
    view.$('.next').click();

    expect(view._hideError).toHaveBeenCalled();
    expect(view.$el.find('.address input.column_autocomplete').val()).toEqual("New York");
    expect(view.options.geocoder.get('formatter')).toBe('New York');
  });

  it("should not georeference if we have NOT filled address input", function() {
    TestUtil.feedTable(table, 1);
    view.render();
    spyOn(view, "_showError");
    view.model.set('option',1);
    view.$('.next').click();
    expect(view._showError).toHaveBeenCalled();
    expect(view.$el.css('display')).not.toBe('none');
    expect(view.options.geocoder.get('formatter')).toBe('');
  });

  it("should change the view model when clicks over other option", function() {
    TestUtil.feedTable(table, 1);
    view.render();
    view.$('ul.options > li:eq(1) > a').click();
    expect(view.$('ul.options > li:eq(1) > a').hasClass('selected')).toBeTruthy();
    expect(view.$('ul.options > li:eq(1)').hasClass('active')).toBeTruthy();
  });

  it("shouldn't geocode when users don't have enough rights", function() {
    var a = _.clone(user.get('geocoding'));
    a.hard_limit = true;
    a.monthly_use = 5000;
    user.set('geocoding', a);
    TestUtil.feedTable(table, 1);
    spyOn(view,'hide');
    view.render();
    view.$('ul.options > li:eq(1) > a').click();
    expect(view.$('a.next').hasClass('disabled')).toBeTruthy();
    view.$('a.next').click();
    expect(view.options.geocoder.get('formatter')).toBe('');
    expect(view.hide).not.toHaveBeenCalled();
  });

  it("should change the button title after selecting the second option", function() {

    TestUtil.feedTable(table, 1);
    view.render();

    view.model.set('option', 2);

    view.$('.next').click();
    expect(view.$('.next').text()).toEqual("Continue");

    view.$('.back').click();
    expect(view.$('.next').text()).toEqual("Georeference");

  });

  it("should set the georeference types option", function() {

    TestUtil.feedTable(table, 1);
    view.render();

    view.model.set('option', 2);

    view.$('.next').click();

    expect(view.$('li.point').length).toBeTruthy();
    expect(view.$('li.polygon').length).toBeTruthy();

  });

  describe("cdb.admin.GeoreferenceStyles", function() {

    var view;

    beforeEach(function() {
      view = new cdb.admin.GeoreferenceStyles();

    });

    it("should render properly options list", function() {

      view.render();
      expect(view.$('li.point').length).toBeTruthy();
      expect(view.$('li.polygon').length).toBeTruthy();

    });

    it("should allow changing the active style", function() {

      view.render();
      view.model.set("geometry_type", "polygon");

      expect(view.$('li.point').hasClass("selected")).toBeFalsy();
      expect(view.$('li.polygon').hasClass("selected")).toBeTruthy();

      view.model.set("geometry_type", "point");

      expect(view.$('li.point').hasClass("selected")).toBeTruthy();
      expect(view.$('li.polygon').hasClass("selected")).toBeFalsy();

    });

    it("should allow to disable the styles", function() {

      view.render();
      view.model.set("pointEnabled", false);

      expect(view.$('li.point').hasClass("disabled")).toBeTruthy();

      view.model.set("polygonEnabled", false);
      expect(view.$('li.polygon').hasClass("disabled")).toBeTruthy();

    });

  });
});
