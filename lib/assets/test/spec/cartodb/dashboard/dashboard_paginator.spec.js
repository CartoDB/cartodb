describe("DashboardPaginator", function() {

  var paginator;
  var tables;

  afterEach(function() {
    paginator.$el.remove();
  });

  beforeEach(function() {

    tables = new cdb.admin.Tables();
    this.el = $('<div></div>');
    this.el.appendTo($('body'));

    // Choose scenario
    paginator = new cdb.admin.DashboardPaginator({
      items: tables,
      what: "tables",
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

  it("should generate a view_all link", function(done) {
    this.createTables(10);

    tables.options.set({ per_page: tables._ITEMS_PER_PAGE});

    tables.fetch();

    setTimeout(function() {
      expect(paginator.per_page).toEqual(tables._ITEMS_PER_PAGE);
      expect(paginator.$el.hasClass(".view_all"));
      expect(paginator.$el.find(".view_all")).toBeTruthy();
      expect(paginator.$el.find(".view_all").text()).toEqual("View all tables");
      done();
    }, 2000);

  });

  it("should render search links", function(done) {

    this.createTables(100);

    tables.options.set({ q: "CartoDB", per_page: tables._ITEMS_PER_PAGE });
    tables.fetch();

    setTimeout(function() {
      expect(paginator.$('.prev').length).toEqual(1);
      expect(paginator.$('.next').length).toEqual(1);
      expect(paginator.$('.next').attr("href")).toEqual("/tables/search/CartoDB/2");
      expect(paginator.total_entries).toEqual(100);

      done();
    }, 2000);



  });

  it("should render tag links", function(done) {

    this.createTables(100);

    tables.options.set({ tags: "CartoDB", per_page: tables._ITEMS_PER_PAGE });
    tables.fetch();

    setTimeout(function() {
      expect(paginator.$('.prev').length).toEqual(1);
      expect(paginator.$('.next').length).toEqual(1);
      expect(paginator.$('.next').attr("href")).toEqual("/tables/tag/CartoDB/2");
      expect(paginator.total_entries).toEqual(100);
      done();
    }, 2000);

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

    expect(paginator.$('.next').attr("href")).toEqual("/tables/2");

    expect(paginator.total_entries).toEqual(100);
  });

});
