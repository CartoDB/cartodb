describe("Public pages header tests", function() {

  var view, $el, model;

  beforeEach(function() {

    $el = $('<header>').addClass("cartodb-public-header");

    model = new cdb.open.AuthenticatedUser({});
    table = new cdb.admin.CartoDBTableMetadata({ name: 'test_table', geometry_types: ['st_polygon'] });

    view = new cdb.open.Header({
      el: $el,
      model: model,
      vis: table,
      current_view: "dashboard",
      owner_username: "test",
      isMobileDevice: false
    });

    cdb.config.set({
      //Testing that it's SaaS (Related info: app/helpers/application_helper.rb)
      cartodb_com_hosted: false 
    });
  })

  afterEach(function() {
    view.clean();
  });

  it("should render properly when authenticated users are 'empty'", function() {
    view.render();
    expect(view.$('ul.options li a').size()).toBe(3);
    expect(view.$('ul.options li a.account').size()).toBe(0);
    expect(view.$('ul.options li a.login').size()).toBe(1);
  });

  it("should render properly when authenticated users are 'empty' and it is a mobile device", function() {
    view.options.isMobileDevice = true;
    view.render();
    expect(view.$('ul.options li a').size()).toBe(2);
    expect(view.$('ul.options li a.account').size()).toBe(0);
    expect(view.$('ul.options li a.login').size()).toBe(1);
    expect(view.$('ul.options li a.signup').size()).toBe(1);
  });

  it("should render properly when authenticated user is filled and it is in dashboard view", function() {
    model.set({ urls: ['http://test.carto.com/dashboard'], username: "test" });

    expect(view.$('ul.options li a').size()).toBe(1);
    expect(view.$('ul.options li a.account').size()).toBe(1);
    expect(view.$('ul.options li a.login').size()).toBe(0);
    expect(view.$('ul.options li a.signup').size()).toBe(0);
  });

  it("should render properly when authenticated user is filled and it is in table or visualization view, edit button should appear", function() {
    view.options.current_view = 'table';
    model.set({ urls: ['http://test.carto.com/dashboard'], username: "test" });

    expect(view.$('ul.options li a').size()).toBe(1);
    expect(view.$('ul.options li a.account').size()).toBe(1);
    expect(view.$('ul.options li a.login').size()).toBe(0);
    expect(view.$('ul.options li a.signup').size()).toBe(0);

    view.options.current_view = 'visualization';
    view.vis = new cdb.open.PublicVisualization({ id: 'aaaa-bbbb-cccc-dddd', name: "fake_2" });
    view.render();

    expect(view.$('ul.options li a').size()).toBe(1);
    expect(view.$('ul.options li a.account').size()).toBe(1);
    expect(view.$('ul.options li a.login').size()).toBe(0);
    expect(view.$('ul.options li a.signup').size()).toBe(0);
  });

});
