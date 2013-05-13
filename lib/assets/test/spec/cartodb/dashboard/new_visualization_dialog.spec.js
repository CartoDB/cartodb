describe("New visualization dialog", function() {

  beforeEach(function() {

    this.server = sinon.fakeServer.create();

    var tableArray = [];

    for(var i = 0; i < 3; i++) {
      tableArray.push({id: i, name: 'test'+i, privacy: 'PUBLIC', rows_counted: 1, updated_at: new Date(), tags: 'a', table_size: 100, description: 'test'});
    }

    var data = '{ total_entries: 3", "tables": '+JSON.stringify(tableArray)+'}';
    this.server.respondWith("GET", "irrelevant.json", [ 200, { "Content-Type": "application/json" }, JSON.stringify(data) ]);

    this.dialog = new cdb.admin.NewVisualizationDialog({ });

  });

  afterEach(function() {

  this.server.restore();

  });

  it("should contain a combo", function() {
    this.dialog.render().open();
    expect(this.dialog.$('.tableListCombo').length > 0).toEqual(true);
  });

  it("should contain a list of tables", function() {
    this.dialog.render().open();
    expect(this.dialog.$('.tables').length > 0).toEqual(true);
  });

  it("should contain an add button", function() {
    this.dialog.render().open();
    expect(this.dialog.$('.add').length > 0).toEqual(true);
  });

  it("should have a collection of table_items", function() {
    this.dialog.render().open();
    expect(this.dialog.table_items).toBeDefined();
  });

  it("should add a table in the list", function() {

    this.dialog.render().open();
    this.dialog.tables.fetch();
    this.server.respond();

    this.dialog.$('.add').click();

    expect(this.dialog.$('.tables li').length == 1).toEqual(true);

  });

});

