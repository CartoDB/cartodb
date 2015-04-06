
describe("Duplicate table", function() {
  var duplicate_dialog, sqlView, table;
  beforeEach(function() {
    table = TestUtil.createTable('test');

    duplicate_dialog = new cdb.admin.DuplicateTableDialog({
      model: table
    });
    duplicate_dialog._importCopy = function() {}
  });

  it("should open the duplicate rename dialog", function() {
    duplicate_dialog.render();
    expect(duplicate_dialog.$el.find(".modal:eq(0) div.head h3").text()).toEqual('Name for your copy of this dataset');
  });

  it("should show an error if the name of the new table is empty or same as actual table", function() {
    duplicate_dialog.render();
    spyOn(duplicate_dialog, '_changeState');
    duplicate_dialog.$el.find(".modal:eq(0) input.text").val("");
    duplicate_dialog.$el.find(".modal:eq(0) div.foot a.button").click();
    expect(duplicate_dialog._changeState).not.toHaveBeenCalled();
  });

  it("should change state if the new table name is ok", function() {
    duplicate_dialog.render();
    spyOn(duplicate_dialog, '_changeState');
    duplicate_dialog.$el.find(".modal:eq(0) input.text").val("new_table_name");
    duplicate_dialog.$el.find(".modal:eq(0) div.foot a.button").click();
    expect(duplicate_dialog._changeState).toHaveBeenCalled();
  });

  // it("should change state if duplication fails", function() {
  //   runs(function() {
  //     duplicate_dialog.render();
  //     spyOn(duplicate_dialog, '_changeState');
  //     spyOn(duplicate_dialog, '_showError');
  //     duplicate_dialog.$el.find(".modal:eq(0) div.foot a.button").click();
  //   });

  //   waits(1000);

  //   runs(function(){
  //     expect(duplicate_dialog._changeState).toHaveBeenCalled();
  //     expect(duplicate_dialog._showError).toHaveBeenCalled();
  //   });
  // });

  xit("should change state if duplication fails", function() {
    //http://development.localhost.lan:3000/api/v1/imports
    this.server = sinon.fakeServer.create();

    this.server.respondWith("POST", "/api/v1/imports", [500, { "Content-Type": "application/json" },'{}']);

    duplicate_dialog.render();
    duplicate_dialog.$el.find(".modal:eq(0) div.foot a.button").click();
    this.server.respond();

    expect(duplicate_dialog.$el.find(".modal:eq(0) div.head h3").text()).toMatch("An error occurred creating your dataset");
    this.server.restore();
  });

  it("should change duplication window if query is applied", function() {
    sqlView = new cdb.admin.SQLViewData(null, { sql: 'select * from a' })
    table.useSQLView(sqlView);

    duplicate_dialog = new cdb.admin.DuplicateTableDialog({
      model: table
    }).render();

    expect(duplicate_dialog.$el.find(".modal:eq(0) div.head h3").text()).toEqual('Name your new dataset from this query');
  });
});
