
describe("tables-list", function() {
  var tablelist
    , tables;

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
    tables.add({id: 1, name: 'test', privacy: 'PRIVATE', rows_counted: 1, updated_at: new Date(), tags: 'a', table_size: 100});
    expect(tablelist._updateListHeader).toHaveBeenCalled();
  });

  it("should update header when new table removed", function() {
    tables.add({id: 1, name: 'test', privacy: 'PRIVATE', rows_counted: 1, updated_at: new Date(), tags: 'a', table_size: 100});
    spyOn(tablelist, '_updateListHeader');
    tables.pop();
    expect(tablelist._updateListHeader).toHaveBeenCalled();
  });
});
