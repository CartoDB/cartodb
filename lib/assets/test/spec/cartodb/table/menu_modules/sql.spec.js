describe("cdb.admin.mod.SQL", function() {

  var view, model, sqlView;
  beforeEach(function() {
    sqlView = new cdb.admin.SQLViewData();
    table = TestUtil.createTable();
    model = new cdb.admin.CartoDBLayer({ query: 'select * from rambo2'});
    model.urlRoot = '/test';
    view = new cdb.admin.mod.SQL({
      el: $('<div>'),
      model: model,
      sqlView: sqlView
    });
  });


  it("should render current sql", function() {
    var sql;
    view.render();
    expect(view.codeEditor.getValue()).toEqual("select * from rambo2");
  });

  it("should render update sql", function() {
    var sql = 'select * from rambo where id = 1';
    view.render();
    model.set({ query: sql });
    expect(view.codeEditor.getValue()).toEqual(sql);
  });

  it("should clean editor when no sql", function() {
    model.set({ query: null });
    view.render();
    expect(view.codeEditor.getValue()).toEqual("");
  });

  it("should update editor when sql is changed", function() {
    model.set({ query: sql='select * from rambo where id = 1' });
    view.render();
    expect(view.codeEditor.getValue()).toEqual(sql);
    model.set({ query: sql='select * from rambo where id = 2' });
    expect(view.codeEditor.getValue()).toEqual(sql);
  });

  it("should set sql view when click on the apply button", function() {
    var sql;
    view.render();
    view.codeEditor.setValue(sql='select * from rambo limit 1');
    view.$('button').trigger('click');
    expect(model.get('query')).toEqual(sql);
  });

  it("should show errors when query fails", function() {
    view.render();
    sqlView.trigger('error', null, {responseText: JSON.stringify({errors: ['test error']}) });
    expect(view.$('.error').html().indexOf('test error')).not.toEqual(-1);
  });

});
