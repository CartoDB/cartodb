describe("cdb.admin.mod.SQL", function() {
  var view, model, sqlView;
  beforeEach(function() {
    sqlView = new cdb.admin.SQLViewData();
    model = TestUtil.createTable();
    sqlView.setSQL('select * from rambo2');
    view = new cdb.admin.mod.SQL({
      el: $('<div>'),
      model: model,
      sqlView: sqlView
    });
  });


  it("should render current sql", function() {
    var sql;
    view.render();
    expect(view.codeEditor.getValue()).toEqual("select * from test");
  });

  it("should render update sql", function() {
    var sql;
    sqlView.setSQL(sql='select * from rambo where id = 1');
    model.useSQLView(sqlView);
    view.render();
    expect(view.codeEditor.getValue()).toEqual(sql);
  });

  it("should clean editor when no sql", function() {
    var sql;
    sqlView.setSQL(undefined);
    view.render();
    expect(view.codeEditor.getValue()).toEqual("select * from test");
  });

  it("should update editor when sql is changed", function() {
    sqlView.setSQL(sql='select * from rambo where id = 1');
    model.useSQLView(sqlView);
    view.render();
    expect(view.codeEditor.getValue()).toEqual(sql);
    sqlView.setSQL(sql='select * from rambo where id = 2');
    expect(view.codeEditor.getValue()).toEqual(sql);
  });

  it("should set sql view when click on the apply button", function() {
    var sql;
    view.render();
    view.codeEditor.setValue(sql='select * from rambo limit 1');
    view.$('button').trigger('click');
    expect(model.data()).toEqual(sqlView);
    expect(model.data().getSQL()).toEqual(sql);

  });

});
