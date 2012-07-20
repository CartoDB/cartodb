
describe("tablelist", function() {
  var tablelist;
  var tables;

  beforeEach(function() {

    cdb.templates.add(new cdb.core.Template({
      name: 'dashboard/views/table_list_item',
      compiled: _.template('')
    }));

    tables = new cdb.admin.Tables();

    tablelist = new cdb.admin.dashboard.TableList({
      model: tables
    });

  });

  it("should update header when new table is added", function() {
    spyOn(tablelist, '_updateListHeader');
    tables.add({name: 'test'});
    expect(tablelist._updateListHeader).toHaveBeenCalled();
  });

  it("should update header when new table removed", function() {

    console.log(tablelist);
    tables.add({name: 'test'});
    spyOn(tablelist, '_updateListHeader');
    tables.pop();
    expect(tablelist._updateListHeader).toHaveBeenCalled();
  });
});
