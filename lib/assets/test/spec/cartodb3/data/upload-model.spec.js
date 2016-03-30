var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var UploadModel = require('../../../../javascripts/cartodb3/data/upload-model');
var UserModel = require('../../../../javascripts/cartodb3/data/user-model');

describe('data/upload-model', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.userModel = new UserModel({
      id: 'uuid',
      username: 'paco',
      organization: {
        id: 'o1'
      }
    }, {
      configModel: configModel
    });
    this.model = new UploadModel({}, {
      userModel: this.userModel,
      configModel: configModel
    });
    spyOn(this.model, 'bind').and.callThrough();
  });

  it('should have progress, change:value and error/invalid binds', function () {
    this.model._initBinds();
    var args_0 = this.model.bind.calls.argsFor(0);
    expect(args_0[0]).toEqual('progress');
    var args_1 = this.model.bind.calls.argsFor(1);
    expect(args_1[0]).toEqual('change:value');
    var args_2 = this.model.bind.calls.argsFor(2);
    expect(args_2[0]).toEqual('error invalid');
  });

  it('should set uploading state when progress change', function () {
    this.model.set({ value: 'http://paco.csv', type: 'url' });
    this.model.trigger('progress', 20);
    expect(this.model.get('state')).toBe('uploading');
  });

  it('should have a fileAttribute set', function () {
    expect(this.model.fileAttribute).toBe('filename');
  });

  it('should validate the model when changes', function () {
    spyOn(this.model, 'validate');
    this.model.setUpload({
      value: 'http://marca.com/paco.jjjjj',
      type: 'url'
    });
    expect(this.model.validate).toHaveBeenCalled();
  });

  it('should change state when validate fails', function () {
    this.model.setUpload({
      type: 'url',
      value: 'hello'
    });
    expect(this.model.get('state')).toBe('error');
  });

  it('should add error code when size validation fails', function () {
    this.model._userModel.set('remaining_byte_quota', 1);

    this.model.setUpload({
      type: 'file',
      value: { name: 'fake.csv', size: 1000 }
    });
    expect(this.model.get('state')).toBe('error');
    expect(this.model.get('error_code')).toBe(8001);

    this.model.setUpload({
      type: 'remote',
      remote_visualization_id: 'iddd',
      size: 1000
    });
    expect(this.model.get('state')).toBe('error');
    expect(this.model.get('error_code')).toBe(8001);

    this.model.setUpload({
      type: 'url',
      value: 'heyheyhey.org'
    });
    expect(this.model.get('state')).toBe('error');
    expect(this.model.get('error_code')).toBe('');
  });

  it('should raise an error when file name is not provided', function () {
    this.model.setUpload({
      type: 'file',
      value: {}
    });
    expect(this.model.get('state')).toBe('error');
    expect(this.model.get('get_error_text').what_about).toBe('File name should be defined');
  });

  describe('.setUpload', function () {
    beforeEach(function () {
      spyOn(this.model, 'set');
    });

    it('should set the proper data and validate it', function () {
      this.model.setUpload({
        type: 'url',
        value: 'heyheyhey.org'
      });
      expect(this.model.set).toHaveBeenCalled();
      expect(this.model.set.calls.argsFor(0)[0]).toEqual(jasmine.objectContaining({ type: 'url', value: 'heyheyhey.org' }));
      expect(this.model.set.calls.argsFor(0)[1]).toEqual(jasmine.objectContaining({ validate: true }));
    });
  });

  describe('.setFresh', function () {
    beforeEach(function () {
      spyOn(this.model, 'set');

      this.model.setFresh({
        foo: 'bar',
        create_vis: true
      });
    });

    it('should set the given dataset', function () {
      expect(this.model.set).toHaveBeenCalled();
      expect(this.model.set.calls.argsFor(0)[0]).toEqual(jasmine.objectContaining({ foo: 'bar' }));
    });

    it('should omit the create_vis value since set in constructor', function () {
      expect(this.model.set.calls.argsFor(0)[0]).not.toEqual(jasmine.objectContaining({ create_vis: true }));
    });
  });
});
