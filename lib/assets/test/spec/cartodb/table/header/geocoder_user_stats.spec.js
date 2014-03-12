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
    expect(view.$('p').text()).toBe('You have 4000 geocoding credits available. Depending on your data you might run out of credits and you will be charged $1.5/1,000 extra geocoding credits.')

  })

  it("should change used class when user is close to the limits", function() {
    var a = _.clone(user.get('geocoding'));
    a.hard_limit = true;
    a.monthly_use = 4500;
    user.set('geocoding', a);

    view.render();
    expect(view.$('div.progress > span.used').hasClass('warning')).toBeTruthy();
    expect(view.$('div.progress > span.used').hasClass('danger')).toBeFalsy();
    expect(view.$('p').text()).toBe('You have 500 geocoding credits available. Depending on your data you might run out of credits, if so consider upgrading to a higher plan.')
  })

  it("should change progress class element when user doesn't have more rows available and text for upgrading", function() {
    var a = _.clone(user.get('geocoding'));
    a.hard_limit = true;
    a.monthly_use = 5000;
    user.set('geocoding', a);

    view.render();
    expect(view.$('div.progress > span.used').hasClass('warning')).toBeFalsy();
    expect(view.$('div.progress > span.used').hasClass('danger')).toBeTruthy();
    expect(view.$('p').text()).toBe('You don\'t have more geocoding credits this month. Upgrade your account to get more.')
    expect(view.$('p a').length).toBe(1);
  })

  it("should change text and progress class element when doesn't have more rows available", function() {
    var a = _.clone(user.get('geocoding'));
    a.hard_limit = false;
    a.monthly_use = 5000;
    user.set('geocoding', a);

    view.render();

    expect(view.$('div.progress > span.used').hasClass('warning')).toBeFalsy();
    expect(view.$('div.progress > span.used').hasClass('danger')).toBeTruthy();
    expect(view.$('p').html()).toBe('You don\'t have more geocoding credits this month. <strong>From now on you will be charged $1.5/1,000 rows</strong>.')
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
    expect(view.$('p').text()).toBe('You have 2 geocoding credits available. Depending on your data you might run out of credits, if so consider upgrading to a higher plan.')
  })

  it("should change text and progress class element when doesn't have more rows available to geocode full table", function() {
    var a = _.clone(user.get('geocoding'));
    a.hard_limit = false;
    a.monthly_use = 4998;
    table.set('rows_counted',3);
    user.set('geocoding', a);

    view.render();

    expect(view.$('div.progress > span.used').hasClass('warning')).toBeTruthy();
    expect(view.$('div.progress > span.used').hasClass('danger')).toBeFalsy();
    expect(view.$('p').text()).toBe('You have 2 geocoding credits available. Depending on your data you might run out of credits and you will be charged $1.5/1,000 extra geocoding credits.')
  })

});
