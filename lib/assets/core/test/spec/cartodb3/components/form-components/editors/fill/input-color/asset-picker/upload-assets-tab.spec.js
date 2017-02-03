var Backbone = require('backbone');
var ConfigModel = require('../../../../../../../../../javascripts/cartodb3/data/config-model');
var UserModel = require('../../../../../../../../../javascripts/cartodb3/data/user-model');
var UploadAssetsTab = require('../../../../../../../../../javascripts/cartodb3/components/form-components/editors/fill/input-color/assets-picker/upload-assets-tab');

describe('components/form-components/editors/fill/input-color/assets-picker/upoad-assets-tab', function () {
  var createCalls = [];
  var files = ['file1.png', 'file2.jpg'];

  function mockCreate (callback) {
    this.view._assetCollection.create = function (options, callbacks) {
      var createCall = {
        kind: options.kind,
        type: options.type,
        url: options.url,
        filename: options.filename,
        callbacks: callbacks
      };

      createCalls.push(createCall);

      if (callback) {
        callbacks[callback].call(this);
      }
    };
  }

  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    var userModel = new UserModel({}, {
      configModel: configModel
    });

    this.view = new UploadAssetsTab({
      model: new Backbone.Model(),
      configModel: configModel,
      userModel: userModel
    });
    this.view.render();
  });

  it('should render', function () {
    expect(this.view.$el.text()).toContain('components.modals.assets-picker.upload-desc');
    expect(this.view.$el.text()).toContain('components.modals.assets-picker.submit');
    expect(this.view.$el.text()).toContain('components.modals.assets-picker.upload-file-url');
  });

  it('should create an asset model for each selected file', function () {
    mockCreate.call(this);
    spyOn(this.view, '_getSelectedFiles').and.returnValue(files);
    spyOn(this.view, '_beforeAssetUpload');
    spyOn(this.view, '_onAssetUploaded');
    spyOn(this.view, '_onAssetUploadError');
    spyOn(this.view, '_onAssetUploadComplete');

    this.view._onFileSelected();

    expect(createCalls.length).toBe(2);
    expect(createCalls[0].kind).toEqual('custom-marker');
    expect(createCalls[0].filename).toEqual(files[0]);
    expect(createCalls[0].type).toEqual('file');
    expect(createCalls[1].kind).toEqual('custom-marker');
    expect(createCalls[1].filename).toEqual(files[1]);
    expect(createCalls[1].type).toEqual('file');

    // Assert that every request callback has been hooked up
    createCalls[0].callbacks['beforeSend']();
    expect(this.view._beforeAssetUpload).toHaveBeenCalled();
    createCalls[0].callbacks['success']();
    expect(this.view._onAssetUploaded).toHaveBeenCalled();
    createCalls[0].callbacks['error']();
    expect(this.view._onAssetUploadError).toHaveBeenCalled();
    createCalls[0].callbacks['complete']();
    expect(this.view._onAssetUploadComplete).toHaveBeenCalled();
  });

  describe('._beforeAssetUpload', function () {
    it('should set loading state', function () {
      this.view._beforeAssetUpload();

      expect(this.view._stateModel.get('uploads')).toBe(1);
      expect(this.view._stateModel.get('status')).toBe('loading');
    });
  });

  describe('._onAssetUploaded', function () {
    it('should reset selection after a successfull upload', function () {
      mockCreate.call(this, 'success');
      spyOn(this.view, '_resetFileSelection');
      spyOn(this.view, '_getSelectedFiles').and.returnValue(files);

      this.view.$('.js-fileInput').trigger('change');

      expect(this.view._resetFileSelection).toHaveBeenCalled();
    });
  });

  describe('._onAssetUploadError', function () {
    it('should reset selection and show the proper error message', function () {
      mockCreate.call(this, 'error');

      spyOn(this.view, '_getSelectedFiles').and.returnValue(files);
      spyOn(this.view, '_parseResponseText').and.returnValue('an error text');
      spyOn(this.view, '_resetFileSelection');

      this.view.$('.js-fileInput').trigger('change');

      expect(this.view._resetFileSelection).toHaveBeenCalled();
      expect(this.view._stateModel.get('error_message')).toBe('an error text');
      expect(this.view._stateModel.get('status')).toBe('error');
    });
  });

  describe('._onAssetUploadComplete', function () {
    it('should trigger an event', function () {
      var uploadEvent = false;

      this.view._stateModel.set('uploads', 2);

      this.view.bind('upload-complete', function () {
        uploadEvent = true;
      }, this);

      mockCreate.call(this, 'complete');

      spyOn(this.view, '_getSelectedFiles').and.returnValue(files);

      this.view.$('.js-fileInput').trigger('change');

      expect(this.view._stateModel.get('status')).toBe('');
      expect(this.view._stateModel.get('uploads')).toBe(0);
      expect(uploadEvent).toBeTruthy();
    });
  });

  describe('._onClickSubmit', function () {
    it('should create an asset model for the URL', function () {
      var url = 'http://carto.com/img/pin.png';

      mockCreate.call(this);
      spyOn(this.view, '_getURL').and.returnValue(url);
      spyOn(this.view, '_beforeAssetUpload');
      spyOn(this.view, '_onAssetUploaded');
      spyOn(this.view, '_onAssetUploadError');
      spyOn(this.view, '_onAssetUploadComplete');

      this.view.$('.js-submit').click();

      expect(createCalls.length).toBe(1);
      expect(createCalls[0].kind).toEqual('custom-marker');
      expect(createCalls[0].url).toEqual(url);
      expect(createCalls[0].type).toEqual('url');

      // Assert that every request callback has been hooked up
      createCalls[0].callbacks['beforeSend']();
      expect(this.view._beforeAssetUpload).toHaveBeenCalled();
      createCalls[0].callbacks['success']();
      expect(this.view._onAssetUploaded).toHaveBeenCalled();
      createCalls[0].callbacks['error']();
      expect(this.view._onAssetUploadError).toHaveBeenCalled();
      createCalls[0].callbacks['complete']();
      expect(this.view._onAssetUploadComplete).toHaveBeenCalled();
    });
  });

  afterEach(function () {
    createCalls = [];
    this.view.clean();
  });
});
