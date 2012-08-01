
describe("table-stats", function() {
  var tablestats
    , tables
    , user;

  beforeEach(function() {

    tables = new cdb.admin.Tables();
    user = new cdb.admin.User({ 
      id : "1",
      name: 'test',
      table_quota: 1,
      byte_quota: 1000000,
      remaining_byte_quota: 10000,
      api_calls: [2,1,23]
    });

    tables.reset([{name: 'test'}]);

    tablestats = new cdb.admin.dashboard.TableStats({
      username: "admin",
      model: user,
      tables: tables
    });

  });

  it("should update user stats when user model is fetched", function() {
    spyOn(tablestats, '_calculateQuotas');
    user.set({ name: 'test2' });
    expect(tablestats._calculateQuotas).toHaveBeenCalled();
  });

});
