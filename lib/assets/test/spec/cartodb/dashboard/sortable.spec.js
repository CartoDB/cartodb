describe("cdb.admin.Sortable ", function() {

  var tables;
  var sortable;

  afterEach(function() {
    sortable.$el.remove();
  });

  beforeEach(function() {

    tables = new cdb.admin.Tables();
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
    expect(sortable.$el.text()).toEqual("Order by modified / created");
  });

  it("should contain a list of items", function() {
    expect(sortable.items).toBeDefined();
  });

  it("should set the default sorting order", function() {

    storage = new cdb.admin.localStorage('tables2.sortable');
    storage.set({ order: "created_at" });

    var sortableCreatedAt = new cdb.admin.Sortable({
      items: tables,
      what: "tables2"
    });

    expect(sortable.model.get("order")).toEqual("updated_at");
    expect(sortableCreatedAt.model.get("order")).toEqual("created_at");

  });

  it("should have a localStorage", function() {
    expect(sortable.storage).toBeDefined();
  });

  it("should set the selected link from the local storage value", function() {
    sortable.storage.set({ order: "updated_at" });
    sortable.render();
    expect(sortable.$el.find(".updated_at").hasClass("selected")).toBeTruthy();
  });

  it("should retrieve the sort hash", function() {

    var sortHash = { data: { o: { updated_at: "desc" }}};
    expect(sortable.getSortHash()).toEqual(sortHash);

    sortHash = { data: { o: { created_at: "desc" }}};

    sortable.orderByCreatedAt();
    expect(sortable.getSortHash()).toEqual(sortHash);

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

  it("should fetch on click", function() {

    /*sortable.render();
    sortable.cancelClicks = true;

    var clicked = false;

    sortable.bind('changeOrder', function() {
    clicked = true;
    });

    sortable.$('a').eq(1).click();
    expect(clicked).toBeTruthy();*/

  });

});
