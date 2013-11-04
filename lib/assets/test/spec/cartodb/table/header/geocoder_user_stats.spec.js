describe("geocoder user stats", function() {

  var view, config, user, table;
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
    view = new cdb.admin.GeocoderStats({
      model: user,
      table: table
    });
  });

  it("should render properly user stats", function() {
    view.render();
    expect(view.$('div.progress').length).toBe(1);
    expect(view.$('div.progress > span.used').hasClass('danger')).toBeFalsy();
    expect(view.$('div.progress > span.used').hasClass('warning')).toBeFalsy();
    expect(view.$('p').html()).toBe('<strong>4000 rows available</strong> under your plan this month.')
  })

  it("should change used class when user is close to the limits", function() {
    var a = _.clone(user.get('geocoding'));
    a.hard_limit = true;
    a.monthly_use = 4500;
    user.set('geocoding', a);

    view.render();
    expect(view.$('div.progress > span.used').hasClass('warning')).toBeTruthy();
    expect(view.$('div.progress > span.used').hasClass('danger')).toBeFalsy();
    expect(view.$('a.need').length).toBe(1);
    expect(view.$('p').html()).toBe('<strong>500 rows available</strong> under your plan this month.')
  })

  it("should change progress class element when user doesn't have more rows available and text for upgrading", function() {
    var a = _.clone(user.get('geocoding'));
    a.hard_limit = true;
    a.monthly_use = 5000;
    user.set('geocoding', a);

    view.render();
    expect(view.$('div.progress > span.used').hasClass('warning')).toBeFalsy();
    expect(view.$('div.progress > span.used').hasClass('danger')).toBeTruthy();
    expect(view.$('a.need').length).toBe(0);
    expect(view.$('p').html()).toBe('No rows available under your plan this month. <a href="http://localhost:3000/account/staging20/upgrade">Upgrade your account</a> to get more.')
  })

  it("should change text and progress class element when doesn't have more rows available", function() {
    var a = _.clone(user.get('geocoding'));
    a.hard_limit = false;
    a.monthly_use = 5000;
    user.set('geocoding', a);

    view.render();

    expect(view.$('div.progress > span.used').hasClass('warning')).toBeFalsy();
    expect(view.$('div.progress > span.used').hasClass('danger')).toBeTruthy();
    expect(view.$('a.need').length).toBe(0);
    expect(view.$('p').html()).toBe('No rows available under your plan this month. <strong>$1.5/1,000 rows will be charged</strong>.')
  });

  it("should change progress class element when user doesn't have more rows available and text for upgrading", function() {
    var a = _.clone(user.get('geocoding'));
    a.hard_limit = true;
    a.monthly_use = 4998;
    table.set('rows_counted',3);
    user.set('geocoding', a);

    view.render();
    expect(view.$('div.progress > span.used').hasClass('warning')).toBeTruthy();
    expect(view.$('div.progress > span.used').hasClass('danger')).toBeFalsy();
    expect(view.$('a.need').length).toBe(1);
    expect(view.$('p').html()).toBe('<strong>Only first 2 rows will be geocoded</strong> under your plan this month.')
  })

  it("should change text and progress class element when doesn't have more rows available", function() {
    var a = _.clone(user.get('geocoding'));
    a.hard_limit = false;
    a.monthly_use = 4998;
    table.set('rows_counted',3);
    user.set('geocoding', a);

    view.render();

    expect(view.$('div.progress > span.used').hasClass('warning')).toBeTruthy();
    expect(view.$('div.progress > span.used').hasClass('danger')).toBeFalsy();
    expect(view.$('a.need').length).toBe(0);
    expect(view.$('p').html()).toBe('<strong>First 2 rows available</strong> under your plan, next <strong>$1.5 per row</strong>.')
  })
  
});
