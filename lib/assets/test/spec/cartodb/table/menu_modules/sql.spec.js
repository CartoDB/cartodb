describe("SQL module", function() {

  var view, model, sqlView, user;
  beforeEach(function() {
    sqlView = new cdb.admin.SQLViewData();
    table = TestUtil.createTable();
    model = new cdb.admin.CartoDBLayer({ query: 'select * from rambo2', table_name: 'jamon'});
    model.bindSQLView(sqlView);
    model.urlRoot = '/test';
    user = new cdb.admin.User({
      username: 'u'
    });
    view = new cdb.admin.mod.SQL({
      el: $('<div>'),
      model: model,
      user: user
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

  it("should change query value when a table name has happened", function() {
    model.set({ query: 'select * from cto' }, { silent: true });
    view.render();
    
    spyOn(view.codeEditor, 'setValue');
    model.set({ table_name: "new_cto" });
    expect(view.codeEditor.setValue.calls.count()).toEqual(1);

    // Reset calls
    view.codeEditor.setValue.calls.reset();
    
    model.set({ query: null }, { silent: true });
    model.set({ table_name: "old_cto" });
    expect(view.codeEditor.setValue.calls.count()).toEqual(2);
  })

  it("should set sql view when click on the apply button", function() {
    var sql;
    var o =  {
      sql: function(){}
    }
    spyOn(o, 'sql');
    spyOn(view.model, 'addToHistory');
    view.render();
    view.codeEditor.setValue(sql='select * from rambo limit 1');
    view.$('button').trigger('click');
    expect(view.model.addToHistory).toHaveBeenCalled();
  });

  it("should replace {table_name}", function() {
    view.render();
    view.model.table.set({'name': 'test'}, { silent: true});
    view.codeEditor.setValue(sql='select * from {table_name} limit 1');
    spyOn(view.model, 'applySQLView');
    view.$('button').trigger('click');
    expect(view.model.applySQLView).toHaveBeenCalledWith('select * from test limit 1');
  });

  it("should replace/remove ; character", function() {
    view.render();
    view.model.table.set({'name': 'test'}, { silent: true});
    spyOn(view.model, 'applySQLView');
    
    view.codeEditor.setValue(sql='select cartodb_id from (select * from test) as ha;');
    view.$('button').trigger('click');
    expect(view.model.applySQLView).toHaveBeenCalledWith('select cartodb_id from (select * from test) as ha');

    view.codeEditor.setValue(sql="select * from table where name = 'our;CTO;is;the;fucking;master'");
    view.$('button').trigger('click');
    expect(view.model.applySQLView).toHaveBeenCalledWith("select * from table where name = 'our;CTO;is;the;fucking;master'");
  });

  it("should show errors when query fails", function() {
    spyOn(view, '_adjustCodeEditorSize');
    view.render();
    view.model.trigger('errorSQLView', {responseText: JSON.stringify({errors: ['test error']}) });
    expect(view.$('.error').html().indexOf('test error')).not.toEqual(-1);
    expect(view._adjustCodeEditorSize).toHaveBeenCalled();
  });

  it("should clear errors when sql is changed", function() {
    view.render();
    spyOn(view, '_clearErrors');
    model.set({ query: sql='select * from rambo where id = 2' });
    expect(view._clearErrors).toHaveBeenCalled();
  });

  it("should clear a sql previously applied", function() {
    view.render();
    view.codeEditor.setValue(sql='select * from rambo limit 1');

    spyOn(view.model, 'addToHistory');
    spyOn(view, '_clearErrors');

    view.$('button').trigger('click');
    
    expect(view._clearErrors).toHaveBeenCalled();
    expect(view.model.addToHistory).toHaveBeenCalled();
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

  it("should not update sql in the editor if there was a query on it and there is no new query", function() {
    var sql;
    model.set('sql', 'select * from test');
    view.render();
    view.codeEditor.setValue(sql='insert into table (name) value (1)');
    model.set('sql', null);
    expect(view.codeEditor.getValue()).toEqual(sql);
  });

  it("should qualify tables", function() {
    user.tables = ['table1', 'table2', 'table3', 'Dentist', 'dentist', 'allbusiness'];
    var sql = view.qualifyTables(
      "select * from table1, table2,\"table3\", uu.table, \"uu\".table3");
    expect(sql).toEqual(
      "select * from u.table1, u.table2,u.\"table3\", uu.table, \"uu\".table3");
    view.user = new cdb.admin.User({ username: 'u-a' });
    view.user.tables = ['table1', 'table2', 'table3'];
    sql = view.qualifyTables(
      "select * from table1, table2,\"table3\", uu.table, \"uu\".table3");
    expect(sql).toEqual(
      'select * from "u-a".table1, "u-a".table2,"u-a".\"table3\", uu.table, \"uu\".table3');

    view.user = new cdb.admin.User({ username: 'timchung' });
    view.user.tables = ['table1', 'table2', 'table3', 'Dentist', 'dentist', 'allbusiness'];

    sql = view.qualifyTables(
      "select * from timchung.allbusiness where position('Dentist' in categories)>0"
    );
    expect(sql).toEqual(
      "select * from timchung.allbusiness where position('Dentist' in categories)>0"
    )

    sql = view.qualifyTables(
      "select * from allbusiness where position('Dentist' in categories)>0"
    );
    expect(sql).toEqual(
      "select * from timchung.allbusiness where position('Dentist' in categories)>0"
    )

    view.user = new cdb.admin.User({ username: 'xxx' });
    view.user.tables = ['parks', 'im_networks', 'Parks'];

    sql = view.qualifyTables(
      "SELECT * FROM parks WHERE poly_source IN ('WSD_Parks', 'IRMA', 'None', 'im_networks')"
    );
    expect(sql).toEqual(
      "SELECT * FROM xxx.parks WHERE poly_source IN ('WSD_Parks', 'IRMA', 'None', 'im_networks')"
    )
  });

});
