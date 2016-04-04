var TableModel = require('../../../../javascripts/cartodb3/data/table-model');
var SynchronizationModel = require('../../../../javascripts/cartodb3/data/synchronization-model');

describe('data/synchronization', function () {
  beforeEach(function () {
    var configModel = jasmine.createSpyObj('configModel', ['get', 'urlVersion']);
    this.tableModel = new TableModel({
      id: 'abc-123',
      name: 'foobar_table'
    }, {
      configModel: configModel
    });
    this.syncModel = new SynchronizationModel({}, {
      configModel: configModel
    });
  });

  describe('JSON stringification', function () {
    it("should return guessing parameters, interval and URL when it doesn't come from a service", function () {
      this.syncModel.set({
        content_guessing: true,
        fake_guessing: false
      });
      var d = this.syncModel.toJSON();
      expect(_.size(d)).toBe(5);
      expect(d.type_guessing).not.toBeUndefined();
      expect(d.url).not.toBeUndefined();
      expect(d.interval).not.toBeUndefined();
      expect(d.fake_guessing).toBeUndefined();
    });

    it('should return the right params when it comes from a remote source', function () {
      this.syncModel.set({
        type: 'remote',
        remote_visualization_id: 123,
        value: 1234
      });
      var d = this.syncModel.toJSON();
      expect(d.value).not.toBeUndefined();
      expect(d.create_vis).toBeFalsy();
      expect(d.remote_visualization_id).not.toBeUndefined();
    });

    it('should add service attributes when it comes from a service', function () {
      this.syncModel.set({
        service_name: 'follower'
      });
      var d = this.syncModel.toJSON();
      expect(_.size(d)).toBe(7);
      expect(d.service_name).not.toBeUndefined();
      expect(d.service_item_id).not.toBeUndefined();
    });
  });

  describe('linkToTable', function () {
    it('should assign id from table it exists and not fetch', function () {
      var s = { id: 'test', duration: 10};
      this.tableModel.set('synchronization', s);
      spyOn(this.syncModel, 'fetch');
      this.syncModel.linkToTable(this.tableModel);
      expect(this.syncModel.get('id')).toEqual(s.id);
      expect(this.syncModel.get('duration')).toEqual(s.duration);
      expect(this.syncModel.fetch).not.toHaveBeenCalled();

      this.tableModel.set('synchronization', { id: 'test2' });
      expect(this.syncModel.get('id')).toEqual('test2');
    });

    it('should remove sync', function () {
      spyOn(this.syncModel, 'destroy');
      this.syncModel.linkToTable(this.tableModel);
      this.tableModel.destroy();
      expect(this.syncModel.destroy).toHaveBeenCalled();
    });

  });

  it('should unset id on destroy', function () {
    this.syncModel.set('id', 'test');
    expect(this.syncModel.isSync()).toEqual(true);
    this.syncModel.destroy();
    expect(this.syncModel.isNew()).toEqual(true);
    expect(this.syncModel.isSync()).toEqual(false);
  });

});
