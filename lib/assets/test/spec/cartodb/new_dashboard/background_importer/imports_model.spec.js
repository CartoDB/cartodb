var cdb = require('cartodb.js');
var ImportsModel = require('../../../../../javascripts/cartodb/new_common/imports_model');
var UploadModel = require('../../../../../javascripts/cartodb/new_common/upload_model');
var ImportModel = require('../../../../../javascripts/cartodb/new_common/import_model');

describe('new_dashboard/background_importer/imports_model', function() {
  beforeEach(function() {
    var user = new cdb.admin.User({ username: 'paco' });
    this.model = new ImportsModel(null, { user: user });
    // No jasmine spy objects
    this.model.imp.createImport = function() {};
    this.model.imp.pollCheck = function() {};
  });

  it('should start in upload step', function() {
    expect(this.model.get('step')).toBe('upload');
  });

  it('should change state when upload or import state change', function() {
    this.model.upl.set('state', 'uploading');
    expect(this.model.get('state')).toBe('uploading');
    expect(this.model.get('step')).toBe('upload');

    this.model.upl.set({
      state: 'uploaded',
      item_queue_id: 'vamos-neno'
    });
    expect(this.model.get('state')).toBe('uploaded');
    expect(this.model.get('id')).toBe('vamos-neno');
    expect(this.model.get('step')).toBe('import');

    this.model.imp.set('state','zipping');
    expect(this.model.get('state')).toBe('zipping');
  });

  it('should return error info', function() {
    expect(this.model.getError().title).toBeDefined();
    expect(this.model.getError().what_about).toBeDefined();
    expect(this.model.getError().error_code).toBeDefined();
  });

  it('should return is import has failed', function() {
    expect(this.model.hasFailed()).toBeFalsy();
    this.model.upl.set('state', 'error');
    expect(this.model.hasFailed()).toBeTruthy();
    this.model.upl.set('state', 'upgraded');
    expect(this.model.hasFailed()).toBeFalsy();
    this.model.set('id','vamos-neno');
    this.model.imp.set('state', 'failure');
    expect(this.model.hasFailed()).toBeTruthy();
    this.model.imp.set('state', 'error');
    expect(this.model.hasFailed()).toBeFalsy();
  });

  it('should return is import has been completed', function() {
    expect(this.model.hasCompleted()).toBeFalsy();
    this.model.set('id', 'vamos-neno');
    this.model.imp.set('state', 'complete');
    expect(this.model.hasCompleted()).toBeTruthy();
    expect(this.model.get('state')).toBe('complete');
  });

  it('should be able to return import info', function() {
    this.model.imp.createImport = function() {};
    this.model.set('id', 'vamos-neno');
    expect(this.model.get('import')).not.toBe(undefined);
    expect(this.model.get('import').item_queue_id).toBe('vamos-neno');
  });

  it('should be able to return upload info', function() {
    this.model.imp.createImport = function() {};
    this.model.upl.set({ type: 'url', value: 'http://fakeurl.es/j.csv' });
    expect(this.model.get('upload')).not.toBe(undefined);
    expect(this.model.get('upload').type).toBe('url');
    expect(this.model.get('upload').value).toBe('http://fakeurl.es/j.csv');
  });

  it('should start importing if model id is set', function() {
    spyOn(this.model.imp, 'pollCheck');
    this.model.set('id', 'vamos-neno');
    expect(this.model.imp.pollCheck).toHaveBeenCalled();
  });


  describe("upload model", function() {

    beforeEach(function() {
      var user = new cdb.admin.User({ username: 'paco' });
      this.upload = new UploadModel({}, { user: user });
      spyOn(this.upload, 'bind').and.callThrough();
    });

    it('should have progress, change:value and error/invalid binds', function() {
      this.upload._initBinds();
      var args_0 = this.upload.bind.calls.argsFor(0);
      expect(args_0[0]).toEqual('progress');
      var args_1 = this.upload.bind.calls.argsFor(1);
      expect(args_1[0]).toEqual('change:value');
      var args_2 = this.upload.bind.calls.argsFor(2);
      expect(args_2[0]).toEqual('error invalid');
    });

    it('should set uploading state when progress change', function() {
      this.upload.set({ value: 'http://paco.csv', type: 'url' });
      this.upload.trigger('progress', 20);
      expect(this.upload.get('state')).toBe('uploading');
    });

    it('should have a fileAttribute set', function() {
      expect(this.upload.fileAttribute).toBe('filename');
    });

    it('should validate the model when changes', function() {
      spyOn(this.upload, 'validate');
      this.upload.set({
        value: 'http://marca.com/paco.jjjjj',
        type: 'url'
      })
      expect(this.upload.validate).toHaveBeenCalled();
    });

    it('should change state when validate fails', function() {
      this.upload.set({
        type: 'url',
        value: 'hello'
      });
      expect(this.upload.get('state')).toBe('error');
    });

    it('should add error code when size validation fails', function() {
      this.upload.user.set('remaining_byte_quota', 1);
      
      this.upload.set({
        type: 'file',
        value: { name: 'fake.csv', size: 1000 }
      });
      expect(this.upload.get('state')).toBe('error');
      expect(this.upload.get('error_code')).toBe(8001);

      this.upload.set({
        type: 'remote',
        remote_visualization_id: 'iddd',
        size: 1000
      });
      expect(this.upload.get('state')).toBe('error');
      expect(this.upload.get('error_code')).toBe(8001);

      this.upload.set({
        type: 'url',
        value: 'heyheyhey.org'
      });
      expect(this.upload.get('state')).toBe('error');
      expect(this.upload.get('error_code')).toBe('');
    });

  });


  describe("import model", function() {

    beforeEach(function() {
      this.imp = new ImportModel();
      spyOn(this.imp, 'bind').and.callThrough();
    });

    it('should have several change binds', function() {
      this.imp._initBinds();
      var args_0 = this.imp.bind.calls.argsFor(0);
      expect(args_0[0]).toEqual('change:state');
      var args_1 = this.imp.bind.calls.argsFor(1);
      expect(args_1[0]).toEqual('change:success');
      var args_2 = this.imp.bind.calls.argsFor(2);
      expect(args_2[0]).toEqual('change:item_queue_id');
    });

    it('should create a sync import when interval is greater than 0', function() {
      spyOn(this.imp, '_createSyncImport');
      spyOn(this.imp, '_createRegularImport');
      this.imp.createImport({ interval: 10 });
      expect(this.imp._createSyncImport).toHaveBeenCalled();
      expect(this.imp._createRegularImport).not.toHaveBeenCalled();
    });

    it('should create a regular import when interval is 0', function() {
      spyOn(this.imp, '_createSyncImport');
      spyOn(this.imp, '_createRegularImport');
      this.imp.createImport({ interval: 0 });
      expect(this.imp._createRegularImport).toHaveBeenCalled();
      expect(this.imp._createSyncImport).not.toHaveBeenCalled();
    });

    it('should stop polling when state is failure or complete', function() {
      spyOn(this.imp, 'destroyCheck');
      this.imp.set('state', 'failure');
      expect(this.imp.destroyCheck).toHaveBeenCalled();
      expect(this.imp.destroyCheck.calls.count()).toEqual(1);
      this.imp.set('state', 'complete');
      expect(this.imp.destroyCheck).toHaveBeenCalled();
      expect(this.imp.destroyCheck.calls.count()).toEqual(2);
    });

    it('should start polling when item_queue_id is set', function() {
      spyOn(this.imp, 'pollCheck');
      this.imp.set('item_queue_id', 'vamos-neno');
      expect(this.imp.pollCheck).toHaveBeenCalled();
    });

  });

});
