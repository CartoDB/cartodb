describe("Dashboard paginator", function() {

  var paginator, router, tables;

  afterEach(function() {
    paginator.$el.remove();
  });

  beforeEach(function() {

    tables = new cdb.admin.Visualizations({ type: "table" });
    this.el = $('<div></div>');
    this.el.appendTo($('body'));
    router = new cdb.admin.dashboard.DashboardRouter();

    // Choose scenario
    paginator = new cdb.admin.DashboardPaginator({
      items: tables,
      what: "tables",
      router: router,
      el: this.el
    });

    this.createTables = function(n) {

      if (!n) n = tables.options.get('per_page')*1.6;

      var newTables = []

      for (var i = 0; i < n; i++) {
        newTables.push({ id: i, name: 'test', privacy: 'PRIVATE', rows_counted: 1, updated_at: new Date(), tags: 'a', table_size: 100, description: 'test' })
      }

      tables.reset(newTables);
      tables.total_entries = newTables.length;
    }

  });

  it("should render the paginator", function() {
    spyOn(paginator, 'render');
    tables.reset([{name : "jamon"}]);
    expect(paginator.render).toHaveBeenCalled();
  });

  it("should render again the paginator after remove a table", function() {
    tables.add({id: 1, name: 'test', privacy: 'PRIVATE', rows_counted: 1, updated_at: new Date(), tags: 'a', table_size: 100});
    spyOn(paginator, 'render');
    tables.pop();
    expect(paginator.render).toHaveBeenCalled();
  });

  it("should render again the paginator after add a new table", function() {
    spyOn(paginator, 'render');
    tables.add({ id: 1, name: 'test', privacy: 'PRIVATE', rows_counted: 1, updated_at: new Date(), tags: 'a', table_size: 100 });
    expect(paginator.render).toHaveBeenCalled();
  });

  it("should contain the number of pages", function() {
    this.createTables(100);
    var total_pages = tables.getTotalPages();

    paginator.render();

    expect(paginator.total_pages).toEqual(total_pages);
  });

  it("should contain the number of entries", function() {
    this.createTables(100);

    paginator.render();

    expect(paginator.total_entries).toEqual(100);
  });

  it("should render search links", function(done) {

    this.createTables(100);

    tables.options.set({ q: "CartoDB", per_page: tables._ITEMS_PER_PAGE });
    tables.fetch();
    tables.reset();

    setTimeout(function() {
      expect(paginator.$('.prev').length).toEqual(1);
      expect(paginator.$('.next').length).toEqual(1);
      expect(paginator.$('.next').attr("href")).toEqual("2");
      expect(paginator.total_entries).toEqual(100);
      expect(paginator.$('p a').length).toBe(0);
      done();
    }, 1000);

  });

  it("should render tag links", function(done) {

    this.createTables(100);

    tables.options.set({ tags: "CartoDB", per_page: tables._ITEMS_PER_PAGE });
    tables.fetch();
    tables.reset();

    setTimeout(function() {
      expect(paginator.$('.prev').length).toEqual(1);
      expect(paginator.$('.next').length).toEqual(1);
      expect(paginator.$('.next').attr("href")).toEqual("2");
      expect(paginator.total_entries).toEqual(100);
      done();
    }, 1000);

  });

  it("should hide the pagination when there are less than ITEMS_PER_PAGE", function() {
    this.createTables(1);
    paginator.render();
    expect(paginator.$el.hasClass("empty")).toBeTruthy();
    expect(paginator.$('a').length).toEqual(0);
  });

  it("should hide the pagination when the're are just ITEMS_PER_PAGE number of items", function() {
    this.createTables(tables._ITEMS_PER_PAGE);
    paginator.render();
    expect(paginator.$el.hasClass("empty")).toBeTruthy();
    expect(paginator.$('a').length).toEqual(0);
  });

  it("should render pages on paginator when needed", function() {
    this.createTables(100);

    paginator.render();

    expect(paginator.$('.prev').length).toEqual(1);
    expect(paginator.$('.next').length).toEqual(1);

    expect(paginator.$('.next').attr("href")).toEqual("2");

    expect(paginator.total_entries).toEqual(100);
  });

  it("should add 'locked tables' link when there are locked tables", function() {
    var server = sinon.fakeServer.create();
    tables.total_entries = 3;

    paginator.render();
    paginator._updatePaginator();
    
    // Several pages + locked visualizations
    server.respondWith('/api/v1/viz/?tag_name=&q=&page=1&type=table&exclude_shared=true&per_page=1&locked=true&tags=', [200, { "Content-Type": "application/json" }, '{"visualizations":[{ "name": "hello"},{ "name": "hello2"}],"total_entries":2}']);
    server.respond();
    expect(paginator.$el.hasClass("empty")).toBeFalsy();
    expect(paginator.$('p a').length).toEqual(1);
    expect(paginator.$('p a').text()).toBe('View your 2 locked tables');

    paginator.locked_vis_clone.total_entries = 1;
    paginator.render();
    expect(paginator.$('p a').text()).toBe('View your  locked table');
  });

  it("should add 'locked visualizations' link when there are locked visualizations", function() {
    var visualizations = new cdb.admin.Visualizations({ type: "derived" });
    visualizations.reset([{name : "jamon"}]);
    visualizations.total_entries = 1;
    var server = sinon.fakeServer.create();

    var new_paginator = new cdb.admin.DashboardPaginator({
      items: visualizations,
      what: "visualizations",
      router: router,
      el: this.el
    });

    new_paginator.render();
    new_paginator._updatePaginator();
    
    // Several pages + locked visualizations
    server.respondWith('/api/v1/viz/?tag_name=&q=&page=1&type=derived&exclude_shared=true&per_page=1&locked=true&tags=', [200, { "Content-Type": "application/json" }, '{"visualizations":[{ "name": "hello"},{ "name": "hello2"}],"total_entries":2}']);
    server.respond();
    expect(new_paginator.$el.hasClass("empty")).toBeFalsy();
    expect(new_paginator.$('p a').length).toEqual(1);
    expect(new_paginator.$('p a').text()).toBe('View your 2 locked visualizations');
  });

  it("should add 'locked visualizations' link when there are any locked visualization", function() {
    var visualizations = new cdb.admin.Visualizations({ type: "derived" });
    visualizations.reset([{name : "jamon"}]);
    visualizations.total_entries = 1;
    var server = sinon.fakeServer.create();

    var new_paginator = new cdb.admin.DashboardPaginator({
      items: visualizations,
      what: "visualizations",
      router: router,
      el: this.el
    });

    new_paginator.render();
    new_paginator._updatePaginator();

    // No pages but locked visualizations
    visualizations.reset();
    server.respondWith('/api/v1/viz/?tag_name=&q=&page=1&type=derived&exclude_shared=true&per_page=1&locked=true&tags=', [200, { "Content-Type": "application/json" }, '{"visualizations":[{ "name": "hello"}],"total_entries":1}']);
    server.respond();

    expect(new_paginator.$el.hasClass("empty")).toBeFalsy();
    expect(new_paginator.$('p a').length).toEqual(1);
    expect(new_paginator.$('p a').text()).toBe('View your  locked visualization');
    expect(new_paginator.$('ul > li').length).toBe(0);

    // Already viewing locked visualizations
    spyOn(new_paginator, '_checkLockTables');
    router.model.set('locked', true);
    new_paginator._updatePaginator();
    expect(new_paginator.$el.hasClass("empty")).toBeFalsy();
    expect(new_paginator.$('p a').length).toEqual(1);
    expect(new_paginator.$('p a').text()).toBe('View your non locked visualizations');
    expect(new_paginator._checkLockTables).not.toHaveBeenCalled();
  });

});
