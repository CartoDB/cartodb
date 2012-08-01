
describe("tables-list", function() {
  var tablelist
    , tables
    , user;

  beforeEach(function() {

    cdb.templates.add(new cdb.core.Template({
      name: 'dashboard/views/table_list_item',
      compiled: _.template('')
    }));

    tables = new cdb.admin.Tables();
    user = new cdb.admin.User({ id : "1" });

    tablelist = new cdb.admin.dashboard.TableList({
      model: tables,
      user: user
    });

  });

  it("should update header on reset", function() {
    spyOn(tablelist, '_updateListHeader');
    tables.reset([
      {id: 1, name: 'test', privacy: 'PRIVATE', rows_counted: 1, updated_at: new Date(), tags: 'a', table_size: 100}
    ]);
    expect(tablelist._updateListHeader).toHaveBeenCalled();
  });

  it("should render tables on reset", function() {
    tables.reset([
      {id: 1, name: 'test', privacy: 'PRIVATE', rows_counted: 1, updated_at: new Date(), tags: 'a', table_size: 100},
      {id: 2, name: 'test', privacy: 'PRIVATE', rows_counted: 1, updated_at: new Date(), tags: 'a', table_size: 100}
    ]);
    expect(tablelist.$('li').length).toEqual(2);
  });
});
