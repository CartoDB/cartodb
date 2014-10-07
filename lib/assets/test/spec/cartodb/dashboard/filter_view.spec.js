describe("Filter view", function() {

  var view, visualizations, tables, user, router;

  afterEach(function() {
    view.clean();
  });

  beforeEach(function() {
    visualizations = new cdb.admin.Visualizations({ type: 'derived' });
    tables = new cdb.admin.Visualizations({ type: 'table' });
    router = new cdb.admin.dashboard.DashboardRouter();
    user = TestUtil.createUser('test');

    view = new cdb.ui.common.FilterView({
      visualizations: visualizations,
      config:         {},
      tables:         tables,
      user:           user,
      router:         router
    });
  });

  it("should render tags-selector + search input", function() {
    view.render();
    expect(_.size(view._subviews)).toBe(1);
    expect(view.$('.filter_options li').length).toBe(1);
  });

  it("should render two links, tags-selector + search input when user belongs to an organization", function() {
    var org = new cdb.admin.Organization({ id:1, users:[1,2,3] })
    user.organization = org;
    view.render();
    expect(_.size(view._subviews)).toBe(1);
    expect(view.$('.filter_options li').length).toBe(3);
  });

  it("should work links when user belongs to an organization", function() {
    var org = new cdb.admin.Organization({ id:1, users:[1,2,3] });
    user.organization = org;
    var where = "";
    router.model.set('model', 'tables');
    
    router.navigate = function(route, opts) { where = route };

    view.$('ul.filter_options li:eq(0) a').click();
    expect(where).toBe('/tables');
    
    where = "";
    router.model.set({
      model:          'visualizations',
      exclude_shared: true
    });

    view.$('ul.filter_options li:eq(1) a').click();
    expect(where).toBe('/visualizations/mine');
  });

  it("should change link texts when router has changed", function() {
    var org = new cdb.admin.Organization({ id:1, users:[1,2,3] });
    user.organization = org;
    
    router.model.set('model', 'tables');
    expect(view.$('ul.filter_options li:eq(0) a').text()).toBe('All tables');

    router.model.set('model', 'visualizations');
    expect(view.$('ul.filter_options li:eq(0) a').text()).toBe('All visualizations');
  });  

  it("should check tags when tables or visualizations collections are fetched", function() {
    router.model.set({ model: 'tables' });
    spyOn(view.tags, 'fetch');
    tables.total_entries = 1;
    tables.reset([{ id:1, name: 'table_name' }]);
    expect(view.tags.fetch).toHaveBeenCalled();
  });

  it("should disable the filter tags view when collection is fetched", function() {
    var server = sinon.fakeServer.create();
    router.model.set({ model: 'tables' });
    tables.reset();
    tables.total_entries = 0;
    server.respondWith('/api/v1/tags?type=table&locked=false&exclude_shared=false', [200, { "Content-Type": "application/json" }, '[]']);
    server.respond();
    expect(view.$('.tags-filter a').hasClass('disabled')).toBeTruthy();
  });

  it("should enable the filter tags view when collection is fetched", function() {
    var server = sinon.fakeServer.create();
    router.model.set({ model: 'tables' });
    tables.reset([{ id:1, name:'test' }]);
    tables.total_entries = 1;
    server.respondWith('/api/v1/tags?type=table&locked=false&exclude_shared=false', [200, { "Content-Type": "application/json" }, '[{ "name" : "paco", "count": 5 }]']);
    server.respond();
    expect(view.$('.tags-filter a').hasClass('disabled')).toBeFalsy();
  });

  it("should navigate to search path when search input is submitted", function() {
    var where = "";
    router.model.set('model', 'tables');
    
    router.navigate = function(route, opts) { where = route };

    view.$('input[type="text"]').val('test');
    view.$('form').submit();
    expect(where).toBe('tables/search/test');

    router.model.set('locked', 'true');
    view.$('input[type="text"]').val('jar');
    view.$('form').submit();
    expect(where).toBe('tables/locked/search/jar');

    router.model.set('exclude_shared', 'true');
    view.$('input[type="text"]').val('check');
    view.$('form').submit();
    expect(where).toBe('tables/mine/locked/search/check');
  });

  it("should set a selected class when all tables view is chosen", function() {
    var org = new cdb.admin.Organization({ id:1, users:[1,2,3] });
    user.organization = org;
    router.model.set({ model: 'tables', exclude_shared: false });
    expect(view.$('ul.filter_options li:eq(0) a').hasClass('selected')).toBeTruthy();
    expect(view.$('ul.filter_options li:eq(1) a').hasClass('selected')).toBeFalsy();
  });

  it("should set a selected class when 'mine' tables view is chosen", function() {
    var org = new cdb.admin.Organization({ id:1, users:[1,2,3] });
    user.organization = org;
    router.model.set({ model: 'tables', exclude_shared: true });
    expect(view.$('ul.filter_options li:eq(0) a').hasClass('selected')).toBeFalsy();
    expect(view.$('ul.filter_options li:eq(1) a').hasClass('selected')).toBeTruthy();
  });

  it("should change input value when tag is chosen", function() {
    router.model.set({
      model:  'tables',
      tag:    'tag'
    });
    expect(view.$('input[type="text"]').val()).toBe(':tag');
  });

  it("should change input value when search is sent", function() {
    router.model.set({
      model:  'tables',
      q:      'search'
    });
    expect(view.$('input[type="text"]').val()).toBe('search');
  });

  it("should show the view when visualizations collection is empty", function() {
    router.model.set('model', 'visualizations');
    spyOn(view, 'show');
    visualizations.total_entries = 0;
    visualizations.reset();
    expect(view.show).toHaveBeenCalled();
  });

  it("should hide the view when tables collection is empty and mine section is selected", function() {
    router.model.set({
      model:          'tables',
      exclude_shared: true
    });
    tables.total_entries = 0;
    spyOn(view, 'hide');
    tables.reset();
    expect(view.hide).toHaveBeenCalled();
  });

  it("should show the view when tables collection has any item", function() {
    router.model.set('model', 'tables');
    spyOn(view, 'show');
    tables.total_entries = 1;
    tables.reset([{ id:1, name: 'table_name' }]);
    expect(view.show).toHaveBeenCalled();
  });

  it("should change have leaks", function() {
    expect(view).toHaveNoLeaks();
  });

});
