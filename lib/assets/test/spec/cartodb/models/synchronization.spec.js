
describe("TableSynchronization", function() {
  var table, sync;
  beforeEach(function() {
    table = TestUtil.createTable('test');
    sync = new cdb.admin.TableSynchronization();
  });

  //
  //
  //
  describe("linkToTable", function() {

    it("should assign id from table it exists and not fetch", function() {
      var s = { id: 'test', duration: 10}
      table.set('synchronization', s);
      spyOn(sync, 'fetch');
      sync.linkToTable(table);
      expect(sync.get('id')).toEqual(s.id);
      expect(sync.get('duration')).toEqual(s.duration);
      expect(sync.fetch).not.toHaveBeenCalled();

      table.set('synchronization', { id: 'test2' });
      expect(sync.get('id')).toEqual('test2');
    });

    it("should remove sync", function() {
      spyOn(sync, 'destroy');
      sync.linkToTable(table);
      table.destroy();
      expect(sync.destroy).toHaveBeenCalled();
    });

  });


  it ("should unset id on destroy", function() {
    sync.set('id', 'test');
    expect(sync.isSync()).toEqual(true);
    sync.destroy();
    expect(sync.isNew()).toEqual(true);
    expect(sync.isSync()).toEqual(false);
  });

});
