describe("New visualization dialog", function() {

  beforeEach(function() {

    this.server = sinon.fakeServer.create();

    var tableArray = [];

    for(var i = 0; i < 3; i++) {
      tableArray.push({id: i, name: 'test'+i, privacy: 'PUBLIC', rows_counted: 1, updated_at: new Date(), tags: 'a', table_size: 100, description: 'test'});
    }

    var user = new cdb.admin.User({ id: 2, name: 'j_a_m' });

    var data = '{ total_entries: 3", "tables": '+JSON.stringify(tableArray)+'}';
    this.server.respondWith("GET", "irrelevant.json", [ 200, { "Content-Type": "application/json" }, JSON.stringify(data) ]);

    visualizations = new cdb.admin.Visualizations({ type: "tables" });;

    this.dialog = new cdb.admin.NewVisualizationDialog({
      user: user
    });

  });

  afterEach(function() {
    this.dialog.clean();
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

  xit("should add a table in the list", function() {

    this.dialog.render().open();
    this.dialog.tables.fetch();
    this.server.respond();
    this.dialog._addCombo();

    this.dialog.table_name = 'table_name';
    this.dialog.$('.add').click();

    expect(this.dialog.$('.tables li').length == 1).toEqual(true);

  });

  it("shouldn't add a table in the list if there's no table selected", function() {

    this.dialog.render().open();
    this.dialog.visualizations.fetch();
    this.server.respond();
    this.dialog._addCombo();

    this.dialog.$('.add').click();

    expect(this.dialog.$('.tables li').length == 0).toEqual(true);

  });

  it("should show a loader by default", function() {
    this.dialog.render().open();
    expect(this.dialog.$el.find(".loader").hasClass("hidden")).toBeFalsy();
  });

  it("should have the dropdown and ok button hidden by default", function() {
    this.dialog.render().open();
    expect(this.dialog.$el.find(".combo_wrapper").hasClass("hidden")).toBeTruthy();
    expect(this.dialog.$el.find(".ok.button").hasClass("hidden")).toBeTruthy();
  });

  it("should set max layers parameter checking user limits", function() {
    var new_user = new cdb.admin.User({ id: 2, name: 'j_a_m', max_layers: 10 });

    dialog = new cdb.admin.NewVisualizationDialog({ user: new_user });

    expect(dialog._MAX_LAYERS).toBe(10)
  });

  it("shouldn't set max layers parameter if user doesn't have any limit", function() {
    var new_user = new cdb.admin.User({ id: 2, name: 'j_a_m' });

    dialog = new cdb.admin.NewVisualizationDialog({ user: new_user });

    expect(dialog._MAX_LAYERS).toBe(3)
  });

  it("shouldn't set max layers parameter if user limit is not valid", function() {
    var new_user = new cdb.admin.User({ id: 2, name: 'j_a_m', max_layers: undefined });
    dialog = new cdb.admin.NewVisualizationDialog({ user: new_user });
    expect(dialog._MAX_LAYERS).toBe(3)
  });



});

