describe("cdb.admin.mod.SQL", function() {
  var view, model;
  beforeEach(function() {
    model = new cdb.admin.SQLViewData();
    model.setSQL('select * from rambo2');
    view = new cdb.admin.mod.SQL({
      sqlView: model
    });
  });


  it("shoudl render currrent sql", function() {
    var sql;
    view.render();
    expect(view.codeEditor.getValue()).toEqual("select * from rambo2");
  });

  it("shoudl render update sql", function() {
    var sql;
    model.setSQL(sql='select * from rambo');
    view.render();
    expect(view.codeEditor.getValue()).toEqual(sql);
  });

  it("should clean editor when no sql", function() {
    var sql;
    model.setSQL(undefined);
    view.render();
    expect(view.codeEditor.getValue()).toEqual('');
  });

});
