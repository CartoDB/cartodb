describe("cdb.admin.Sortable", function() {

  var tables;
  var sortable;

  afterEach(function() {
    sortable.$el.remove();
  });

  beforeEach(function() {

    tables = new cdb.admin.Visualizations({ type: 'table' }),
    this.el = $('<div></div>');
    this.el.appendTo($('body'));

    sortable = new cdb.admin.Sortable({
      items: tables,
      what: "tables"
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

  it("should render the default text", function() {
    sortable.render();
    expect(sortable.$('ul > li').length).toBe(3);
    expect(sortable.$('ul > li:eq(0)').text()).toBe('Order by');
    expect(sortable.$('ul > li:eq(1)').text()).toBe('modified');
    expect(sortable.$('ul > li:eq(2)').text()).toBe('created');
  });

  it("should contain a list of items", function() {
    expect(sortable.items).toBeDefined();
  });

  it("should have a localStorage", function() {
    expect(sortable.storage).toBeDefined();
  });

  it("should set the selected link from the local storage value", function() {
    sortable.storage.set({ order: "updated_at" });
    sortable.render();
    expect(sortable.$el.find(".updated_at").hasClass("selected")).toBeTruthy();
  });

  it("should store the value in local storage", function() {
    sortable.model.set("order", "hola")
    expect(sortable.storage.get("order")).toEqual("hola");
  });

  it("should allow to set the sort method", function() {
    sortable.orderByCreatedAt();
    expect(sortable.model.get("order")).toEqual("created_at");

    sortable.orderByUpdatedAt();
    expect(sortable.model.get("order")).toEqual("updated_at");
  });

  it("should render the links", function() {
    sortable.render();
    expect(sortable.$el.find("a").length).toEqual(2);
  });

  it("should change the selected option on click", function() {

    sortable.render();
    sortable.$el.find(".created_at").click();
    expect(sortable.model.get("order")).toEqual("created_at");
    expect(sortable.$el.find(".created_at").hasClass("selected")).toEqual(true);

    sortable.$el.find(".updated_at").click();
    expect(sortable.model.get("order")).toEqual("updated_at");
    expect(sortable.$el.find(".updated_at").hasClass("selected")).toEqual(true);

  });

  it("should change storage and trigger event on click", function() {
    sortable.render();
    var called = false;
    var changed = false;

    sortable.bind('sortChanged', function() {
      called = true;
    });

    sortable.$('li:eq(2) a').click();

    expect(called).toBeTruthy();
    expect(sortable.storage.get('order')).toBe('created_at');
  });

});
