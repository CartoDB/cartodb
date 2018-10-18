const _ = require('underscore');
const TableSynchronizationModel = require('dashboard/data/table-synchronization-model.js');
const CartoTableMetadata = require('fixtures/dashboard/carto-table-metadata.fixture');
const configModel = require('fixtures/dashboard/config-model.fixture');

describe('dashboard/data/table-synchronization-model', function () {
  let table, sync;

  beforeEach(function () {
    table = CartoTableMetadata({ name: 'test' }, configModel);
    sync = new TableSynchronizationModel({ configModel });
  });

  describe('JSON stringification', function () {
    it("should return guessing parameters, interval and URL when it doesn't come from a service", function () {
      sync.set({
        content_guessing: true,
        fake_guessing: false
      });
      const d = sync.toJSON();
      expect(_.size(d)).toBe(5);
      expect(d.type_guessing).not.toBeUndefined();
      expect(d.url).not.toBeUndefined();
      expect(d.interval).not.toBeUndefined();
      expect(d.fake_guessing).toBeUndefined();
    });

    it('should return the right params when it comes from a remote source', function () {
      sync.set({
        type: 'remote',
        remote_visualization_id: 123,
        value: 1234
      });
      const d = sync.toJSON();
      expect(d.value).not.toBeUndefined();
      expect(d.create_vis).toBeFalsy();
      expect(d.remote_visualization_id).not.toBeUndefined();
    });

    it('should add service attributes when it comes from a service', function () {
      sync.set({
        service_name: 'follower'
      });
      const d = sync.toJSON();
      expect(_.size(d)).toBe(7);
      expect(d.service_name).not.toBeUndefined();
      expect(d.service_item_id).not.toBeUndefined();
    });
  });

  describe('linkToTable', function () {
    it('should assign id from table it exists and not fetch', function () {
      const s = { id: 'test', duration: 10 };
      table.set('synchronization', s);
      spyOn(sync, 'fetch');
      sync.linkToTable(table);
      expect(sync.get('id')).toEqual(s.id);
      expect(sync.get('duration')).toEqual(s.duration);
      expect(sync.fetch).not.toHaveBeenCalled();

      table.set('synchronization', { id: 'test2' });
      expect(sync.get('id')).toEqual('test2');
    });

    it('should remove sync', function () {
      spyOn(sync, 'destroy');
      sync.linkToTable(table);
      table.destroy();
      expect(sync.destroy).toHaveBeenCalled();
    });
  });

  it('should unset id on destroy', function () {
    sync.set('id', 'test');
    expect(sync.isSync()).toEqual(true);
    sync.destroy();
    expect(sync.isNew()).toEqual(true);
    expect(sync.isSync()).toEqual(false);
  });
});
