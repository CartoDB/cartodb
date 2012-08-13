
describe("api-keys", function() {
  var tablelist
    , tables
    , user;

  beforeEach(function() {

    cdb.templates.add(new cdb.core.Template({
      name: 'common/views/settings_item',
      compiled: _.template('')
    }));

    // tables = new cdb.admin.Tables();
    // user = new cdb.admin.User({ id : "1" });

    // tablelist = new cdb.admin.dashboard.TableList({
    //   model: tables,
    //   user: user
    // });
  });

  it("user menu should work", function() {
    // spyOn(tablelist, '_updateListHeader');
    // tables.reset([
    //   {id: 1, name: 'test', privacy: 'PRIVATE', rows_counted: 1, updated_at: new Date(), tags: 'a', table_size: 100, description: 'test'}
    // ]);
    // expect(tablelist._updateListHeader).toHaveBeenCalled();
  });

  // it("should render tables on reset", function() {
  //   tables.reset([
  //     {id: 1, name: 'test', privacy: 'PRIVATE', rows_counted: 1, updated_at: new Date(), tags: 'a', table_size: 100, description: 'test'},
  //     {id: 2, name: 'test', privacy: 'PRIVATE', rows_counted: 1, updated_at: new Date(), tags: 'a', table_size: 100, description: 'test'}
  //   ]);
  //   expect(tablelist.$('li').length).toEqual(2);
  // });
});
