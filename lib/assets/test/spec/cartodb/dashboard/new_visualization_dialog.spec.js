describe("New visualization dialog", function() {

  var dialog, user, visualizations, server;

  beforeEach(function() {

    server = sinon.fakeServer.create();

    var tableArray = [];

    for(var i = 0; i < 3; i++) {
      tableArray.push({id: i, name: 'test'+i, privacy: 'PUBLIC', rows_counted: 1, updated_at: new Date(), tags: 'a', table_size: 100, description: 'test'});
    }

    var user = new cdb.admin.User({ id: 2, name: 'j_a_m' });

    var data = '{ total_entries: 3", "tables": '+JSON.stringify(tableArray)+'}';
    server.respondWith("GET", "irrelevant.json", [ 200, { "Content-Type": "application/json" }, JSON.stringify(data) ]);

    visualizations = new cdb.admin.Visualizations({ type: "tables" });;

    dialog = new cdb.admin.NewVisualizationDialog({
      user: user
    });

  });

  afterEach(function() {
    dialog.clean();
    server.restore();
  });

  it("should contain a combo", function() {
    dialog.render().open();
    expect(dialog.$('.tableListCombo').length > 0).toEqual(true);
  });

  it("should contain a list of tables", function() {
    dialog.render().open();
    expect(dialog.$('.tables').length > 0).toEqual(true);
  });

  it("should contain an add button", function() {
    dialog.render().open();
    expect(dialog.$('.add').length > 0).toEqual(true);
  });

  it("should have a collection of table_items", function() {
    dialog.render().open();
    expect(dialog.table_items).toBeDefined();
  });

  xit("should add a table in the list", function() {

    dialog.render().open();
    dialog.tables.fetch();
    server.respond();
    dialog._addCombo();

    dialog.table_name = 'table_name';
    dialog.$('.add').click();

    expect(dialog.$('.tables li').length == 1).toEqual(true);

  });

  it("shouldn't show combo when there are no visualizations available", function() {
    dialog.visualizations.models = [];

    spyOn(dialog, '_showEmpyState');
    dialog.render().open();
    dialog._onReset();
    
    expect(dialog.$('.tables li').length == 0).toBe(true);
    expect(dialog._showEmpyState).toHaveBeenCalled();
  });

  it("should show a loader by default", function() {
    dialog.render().open();
    expect(dialog.$el.find(".loader").hasClass("hidden")).toBeFalsy();
  });

  it("should have the dropdown and ok button hidden by default", function() {
    dialog.render().open();
    expect(dialog.$el.find(".combo_wrapper").hasClass("hidden")).toBeTruthy();
    expect(dialog.$el.find(".ok.button").hasClass("hidden")).toBeTruthy();
  });

  it("should set max layers parameter checking user limits", function() {
    var new_user = new cdb.admin.User({ id: 2, name: 'j_a_m', max_layers: 10 });
    var view = new cdb.admin.NewVisualizationDialog({ user: new_user });
    expect(view._MAX_LAYERS).toBe(10);
    view.clean();
  });

  it("shouldn't set max layers parameter if user doesn't have any limit", function() {
    var new_user = new cdb.admin.User({ id: 2, name: 'j_a_m' });
    var view = new cdb.admin.NewVisualizationDialog({ user: new_user });
    expect(view._MAX_LAYERS).toBe(3);
    view.clean();
  });

  it("shouldn't set max layers parameter if user limit is not valid", function() {
    var new_user = new cdb.admin.User({ id: 2, name: 'j_a_m', max_layers: undefined });
    var view = new cdb.admin.NewVisualizationDialog({ user: new_user });
    expect(view._MAX_LAYERS).toBe(3);
    view.clean();
  });

});

