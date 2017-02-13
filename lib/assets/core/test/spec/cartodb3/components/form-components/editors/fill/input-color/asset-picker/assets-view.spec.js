var $ = require('jquery');
var Backbone = require('backbone');
var ConfigModel = require('../../../../../../../../../javascripts/cartodb3/data/config-model');
var UserModel = require('../../../../../../../../../javascripts/cartodb3/data/user-model');
var AssetsView = require('../../../../../../../../../javascripts/cartodb3/components/form-components/editors/fill/input-color/assets-picker/assets-view');

describe('components/form-components/editors/fill/input-color/assets-view', function () {
  var createCalls = [];
  var files = ['one', 'two'];

  beforeEach(function () {
    spyOn($, 'ajax').and.callFake(function (req) {
      var d = $.Deferred();
      d.resolve();
      return d.promise();
    });

    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    var userModel = new UserModel({}, {
      configModel: configModel
    });

    this.view = new AssetsView({
      model: new Backbone.Model(),
      modalModel: {
        destroy: function () {}
      },
      configModel: configModel,
      userModel: userModel
    });

    this.view.render();
  });

  function mockCreate (callback) {
    this.view._uploadAssetCollection.create = function (options, callbacks) {
      var createCall = {
        kind: options.kind,
        type: options.type,
        url: options.url,
        filename: options.filename,
        callbacks: callbacks
      };

      createCalls.push(createCall);

      if (callback) {
        if (callback === 'error') {
          callbacks[callback].call(this, new Backbone.Model(), {
            responseText: '{"error": ["hi, I am an error"]}'
          });
        } else {
          callbacks[callback].call(this);
        }
      }
    };
  }

  describe('render', function () {
    it('should render tabs', function () {
      expect(this.view.$el.text()).toBeDefined();
      expect(this.view.$el.text()).toContain('components.modals.add-asset.icons');
      expect(this.view.$el.text()).toContain('components.modals.add-asset.your-uploads');
      expect(this.view.$el.text()).toContain('components.modals.add-asset.upload-file');
    });

    it('should render upload button', function () {
      expect(this.view.$('.js-add').length).toBe(1);
    });

    it('should toggle the upload button state', function () {
      this.view._selectedAsset.set('url', 'batman.png');
      expect(this.view.$('.js-add').hasClass('is-disabled')).toBeFalsy();
      this.view._selectedAsset.set('url', '');
      expect(this.view.$('.js-add').hasClass('is-disabled')).toBeTruthy();
    });

    it('should render disclaimer', function () {
      expect(this.view.$el.text()).toContain('assets.maki-icons.disclaimer');
    });
  });

  describe('._onFileSelected', function () {
    it('should create an icon model for each selected file', function () {
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
      spyOn(this.view, '_resetFileSelection');

      this.view.$('.js-fileInput').trigger('change');

      expect(this.view._resetFileSelection).toHaveBeenCalled();
      expect(this.view._stateModel.get('error_message')).toBe('hi, I am an error');
      expect(this.view._stateModel.get('status')).toBe('error');
    });
  });

  describe('._uploadURL', function () {
    it('should create an upload', function () {
      var url = 'http://carto.com/img/pin.png';

      mockCreate.call(this);
      spyOn(this.view, '_beforeAssetUpload');
      spyOn(this.view, '_onAssetUploaded');
      spyOn(this.view, '_onAssetUploadError');
      spyOn(this.view, '_onAssetUploadComplete');

      this.view._uploadURL(url);

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

  describe('._onAssetUploadComplete', function () {
    it('should go to the upload tab', function () {
      this.view._stateModel.set('uploads', 2);

      mockCreate.call(this, 'complete');

      spyOn(this.view, '_getSelectedFiles').and.returnValue(files);

      this.view.$('.js-fileInput').trigger('change');

      expect(this.view._stateModel.get('status')).toBe('show');
      expect(this.view._stateModel.get('uploads')).toBe(0);
      expect(this.view._assetsTabPaneView.getSelectedTabPaneName()).toBe('your-uploads');
    });
  });

  describe('_onSetImage', function () {
    it('should kill event, trigger a `change` event and destroy modal', function () {
      var changeTriggered = false;
      var changeImage;

      this.view._selectedAsset.set({
        url: 'batman.png',
        kind: 'marker'
      });

      this.view.on('change', function (data) {
        changeTriggered = true;
        changeImage = data;
      });
      spyOn(this.view, 'killEvent');
      spyOn(this.view._modalModel, 'destroy');

      this.view.$('.js-add').click();

      expect(this.view.killEvent).toHaveBeenCalled();
      expect(changeTriggered).toBe(true);
      expect(changeImage.url).toBe('batman.png');
      expect(changeImage.kind).toBe('marker');
      expect(this.view._modalModel.destroy).toHaveBeenCalled();
    });
  });

  afterEach(function () {
    createCalls = [];
    this.view.clean();
  });
});
