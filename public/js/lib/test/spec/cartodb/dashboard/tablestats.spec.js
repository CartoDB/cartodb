
describe("tablestats", function() {
  var tablestats
    , tables;

  beforeEach(function() {

    tables = new cdb.admin.Tables();

    tablestats = new cdb.admin.dashboard.TableStats({
      username: "admin",
      userid: "1",
      tables: tables
    })

  });

  it("should update user stats when tables model is fetched", function() {
    spyOn(tablestats, '_tableChange');
    tables.fetch();
    expect(tablestats._tableChange).toHaveBeenCalled();
  });

  it("should update user stats when new table is added", function() {
    spyOn(tablestats, '_tableChange');
    tables.add({name: 'test'});
    expect(tablestats._tableChange).toHaveBeenCalled();
  });

  it("should update user stats when a table is removed", function() {
    tables.add({name: 'test'});
    spyOn(tablestats, '_tableChange');
    tables.remove(tables.at(0));
    expect(tablestats._tableChange).toHaveBeenCalled();
  });
});
