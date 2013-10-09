
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
  
});
