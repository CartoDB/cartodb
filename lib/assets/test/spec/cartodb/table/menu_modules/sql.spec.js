describe("cdb.admin.mod.SQL", function() {

  var view, model, sqlView;
  beforeEach(function() {
    sqlView = new cdb.admin.SQLViewData();
    table = TestUtil.createTable();
    model = new cdb.admin.CartoDBLayer({ query: 'select * from rambo2', table_name: 'jamon'});
    model.urlRoot = '/test';
    view = new cdb.admin.mod.SQL({
      el: $('<div>'),
      model: model,
      sqlView: sqlView,
      table: table
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

  it("should put the default sql when no sql", function() {
    model.set({ query: null });
    view.render();
    expect(view.codeEditor.getValue()).toEqual(view._defaultSQL());
  });

  it("should update editor when sql is changed", function() {
    model.set({ query: sql='select * from rambo where id = 1' });
    view.render();
    expect(view.codeEditor.getValue()).toEqual(sql);
    model.set({ query: sql='select * from rambo where id = 2' });
    expect(view.codeEditor.getValue()).toEqual(sql);
  });

  it("should detect when the sql hasn't changed", function() {
    model.set({ query: sql='select * from rambo where id = 1' });
    view.render();
    expect(view.hasChanges()).toBeFalsy();
  })

  it("should detect when the sql has changed", function() {
    model.set({ query: sql='select * from rambo where id = 1' });
    view.render();
    view.codeEditor.setValue('spaggetti');
    expect(view.hasChanges()).toBeTruthy();
  })

  // Removed due to the fact that this funcionality is hidden for the moment
  //
  // it("should change query value when a table name has happened", function() {
  //   model.set({ query: 'select * from rambo where id = 1' });
  //   view.render();
  //   view.codeEditor.setValue('spaggetti');
  //   spyOn(view.codeEditor, 'setValue');
  //   model.set({ "table_name": "jamon_testing" });
  //   expect(view.codeEditor.setValue).toHaveBeenCalled();
  // })

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

  it("should clear errors when sql is changed", function() {
    view.render();
    spyOn(view, '_clearErrors');
    model.set({ query: sql='select * from rambo where id = 2' });
    expect(view._clearErrors).toHaveBeenCalled();
  });

  it("should not save layer model on write queries", function() {
    var sql;
    var a = { test: function() {} };
    spyOn(a, 'test');
    spyOn(model, 'save');
    view.render();
    view.codeEditor.setValue(sql='insert into table (name) value (1)');
    view.$('button').trigger('click');
    expect(model.get('query')).not.toEqual(sql);
    expect(model.save).not.toHaveBeenCalled();
  });

});
