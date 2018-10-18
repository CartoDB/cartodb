const userFixture = require('fixtures/dashboard/user-model.fixture');
const configModel = require('fixtures/dashboard/config-model.fixture');
const ImportsModel = require('dashboard/data/imports-model');
const UploadModel = require('dashboard/data/upload-model');

describe('common/background_polling/imports_model', function () {
  beforeEach(function () {
    var user = userFixture({ username: 'paco' });
    this.model = new ImportsModel(null, { userModel: user, configModel });
    // No jasmine spy objects
    this.model._importModel.createImport = function () {};
    this.model._importModel.pollCheck = function () {};
  });

  it('should start in upload step', function () {
    expect(this.model.get('step')).toBe('upload');
  });

  it('should change state when upload or import state change', function () {
    this.model._uploadModel.set('state', 'uploading');
    expect(this.model.get('state')).toBe('uploading');
    expect(this.model.get('step')).toBe('upload');

    this.model._uploadModel.set({
      state: 'uploaded',
      item_queue_id: 'vamos-neno'
    });
    expect(this.model.get('state')).toBe('uploaded');
    expect(this.model.get('id')).toBe('vamos-neno');
    expect(this.model.get('step')).toBe('import');

    this.model._importModel.set('state', 'zipping');
    expect(this.model.get('state')).toBe('zipping');
  });

  it('should return error info', function () {
    expect(this.model.getError().title).toBeDefined();
    expect(this.model.getError().what_about).toBeDefined();
    expect(this.model.getError().error_code).toBeDefined();
  });

  it('should return is import has failed', function () {
    expect(this.model.hasFailed()).toBeFalsy();
    this.model._uploadModel.set('state', 'error');
    expect(this.model.hasFailed()).toBeTruthy();
    this.model._uploadModel.set('state', 'upgraded');
    expect(this.model.hasFailed()).toBeFalsy();
    this.model.set('id', 'vamos-neno');
    this.model._importModel.set('state', 'failure');
    expect(this.model.hasFailed()).toBeTruthy();
    this.model._importModel.set('state', 'error');
    expect(this.model.hasFailed()).toBeFalsy();
  });

  it('should return is import has been completed', function () {
    expect(this.model.hasCompleted()).toBeFalsy();
    this.model.set('id', 'vamos-neno');
    this.model._importModel.set('state', 'complete');
    expect(this.model.hasCompleted()).toBeTruthy();
    expect(this.model.get('state')).toBe('complete');
  });

  it('should be able to return import info', function () {
    this.model._importModel.createImport = function () {};
    this.model.set('id', 'vamos-neno');
    expect(this.model.get('import')).not.toBe(undefined);
    expect(this.model.get('import').item_queue_id).toBe('vamos-neno');
  });

  it('should be able to return upload info', function () {
    this.model._importModel.createImport = function () {};
    this.model._uploadModel.set({ type: 'url', value: 'http://fakeurl.es/j.csv' });
    expect(this.model.get('upload')).not.toBe(undefined);
    expect(this.model.get('upload').type).toBe('url');
    expect(this.model.get('upload').value).toBe('http://fakeurl.es/j.csv');
  });

  it('should start importing if model id is set', function () {
    spyOn(this.model._importModel, 'pollCheck');
    this.model.set('id', 'vamos-neno');
    expect(this.model._importModel.pollCheck).toHaveBeenCalled();
  });

  it('should stop upload and import when error is set', function () {
    spyOn(this.model, 'stopUpload');
    spyOn(this.model, 'stopImport');
    this.model.setError({ error_code: 1111 });
    expect(this.model.stopUpload).toHaveBeenCalled();
    expect(this.model.stopImport).toHaveBeenCalled();
    expect(this.model.get('state')).toBe('error');
  });

  describe('checkStatus', function () {
    beforeEach(function () {
      spyOn(this.model._importModel, 'set');
      spyOn(this.model._importModel, 'createImport');
      spyOn(this.model._uploadModel, 'upload');
    });

    it('should stop process when upload is not valid', function () {
      this.model._checkStatus();
      expect(this.model._importModel.set).not.toHaveBeenCalled();
      expect(this.model._importModel.createImport).not.toHaveBeenCalled();
      expect(this.model._uploadModel.upload).not.toHaveBeenCalled();
    });

    it('should not stop process when upload is not valid but there is an id already set', function () {
      this.model._uploadModel.set({
        type: 'url',
        value: ''
      });
      this.model.set('id', 'idd');
      this.model._checkStatus();
      expect(this.model._importModel.set).toHaveBeenCalled();
    });

    it('should start upload when type is file', function () {
      this.model._uploadModel.set({
        type: 'file',
        value: { name: 'fake.csv', size: 1000 }
      });
      this.model._checkStatus();
      expect(this.model._uploadModel.upload).toHaveBeenCalled();
    });

    it('should create an import when type is not file and there is no id defined', function () {
      this.model._uploadModel.set({
        type: 'url',
        value: 'http://paco.com'
      });
      this.model._checkStatus();
      expect(this.model._importModel.createImport).toHaveBeenCalled();
    });
  });

  describe('upload model', function () {
    beforeEach(function () {
      var user = userFixture({ username: 'paco' });
      this.upload = new UploadModel({}, { userModel: user, configModel });
      spyOn(this.upload, 'bind').and.callThrough();
    });

    it('should have progress, change:value and error/invalid binds', function () {
      this.upload._initBinds();
      var args_0 = this.upload.bind.calls.argsFor(0);
      expect(args_0[0]).toEqual('progress');
      var args_1 = this.upload.bind.calls.argsFor(1);
      expect(args_1[0]).toEqual('change:value');
      var args_2 = this.upload.bind.calls.argsFor(2);
      expect(args_2[0]).toEqual('error invalid');
    });

    it('should set uploading state when progress change', function () {
      this.upload.set({ value: 'http://paco.csv', type: 'url' });
      this.upload.trigger('progress', 20);
      expect(this.upload.get('state')).toBe('uploading');
    });

    it('should have a fileAttribute set', function () {
      expect(this.upload.fileAttribute).toBe('filename');
    });

    it('should change state when validate fails', function () {
      this.upload.set({
        type: 'url',
        value: 'hello'
      }, { validate: true });
      expect(this.upload.get('state')).toBe('error');
    });

    it('should add error code when size validation fails', function () {
      this.upload._userModel.set('remaining_byte_quota', 1);

      this.upload.set({
        type: 'file',
        value: { name: 'fake.csv', size: 1000 }
      }, { validate: true });
      expect(this.upload.get('state')).toBe('error');
      expect(this.upload.get('error_code')).toBe(8001);

      this.upload.set({
        type: 'remote',
        remote_visualization_id: 'iddd',
        size: 1000
      }, { validate: true });
      expect(this.upload.get('state')).toBe('error');
      expect(this.upload.get('error_code')).toBe(8001);

      this.upload.set({
        type: 'url',
        value: 'heyheyhey.org'
      }, { validate: true });
      expect(this.upload.get('state')).toBe('error');
      expect(this.upload.get('error_code')).toBe('');
    });

    it('should raise an error when file name is not provided', function () {
      this.upload.set({
        type: 'file',
        value: { }
      }, { validate: true });
      expect(this.upload.get('state')).toBe('error');
      expect(this.upload.get('get_error_text').what_about).toBe('data.upload-model.file-defined');
    });

    describe('.setFresh', function () {
      beforeEach(function () {
        spyOn(this.upload, 'set');

        this.upload.setFresh({
          foo: 'bar',
          create_vis: true
        });
      });

      it('should set the given dataset', function () {
        expect(this.upload.set).toHaveBeenCalled();
        expect(this.upload.set.calls.argsFor(0)[0]).toEqual(jasmine.objectContaining({ foo: 'bar' }));
      });

      it('should omit the create_vis value since set in constructor', function () {
        expect(this.upload.set.calls.argsFor(0)[0]).not.toEqual(jasmine.objectContaining({ create_vis: true }));
      });
    });
  });

  describe('import model', function () {
    it('should not have any tests because we are using the builder one');
  });
});
