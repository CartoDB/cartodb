var $ = require('jquery');
var Backbone = require('backbone');
var ConfigModel = require('builder/data/config-model');
var UserModel = require('builder/data/user-model');
var AssetsView = require('builder/components/form-components/editors/fill/input-color/assets-picker/assets-view');

describe('components/form-components/editors/fill/input-color/assets-view', function () {
  var createCalls = [];
  var files = ['one', 'two'];

  beforeEach(function () {
    spyOn($, 'ajax').and.callFake(function (req) {
      var d = $.Deferred();
      d.resolve();
      return d.promise();
    });

    this.model = new Backbone.Model();

    this._configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this._userModel = new UserModel({}, {
      configModel: this._configModel
    });

    this.view = new AssetsView({
      model: this.model,
      modalModel: {
        destroy: function () {}
      },
      configModel: this._configModel,
      userModel: this._userModel
    });

    this.view.render();
  });

  function mockCreate (callback) {
    this.view._userAssetCollection.create = function (options, callbacks) {
      var createCall = {
        kind: options.kind,
        type: options.type,
        url: options.url,
        filename: options.filename,
        callbacks: callbacks
      };

      var model = this.add(options);

      createCalls.push(createCall);

      if (callback) {
        if (callback === 'error') {
          callbacks[callback].call(this, model, {
            responseText: '{"error": ["hi, I am an error"]}'
          });
        } else if (callback === 'success') {
          callbacks['complete'].call(this);
          callbacks[callback].call(this);
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
      expect(this.view.$('.js-add').hasClass('is-disabled')).toBeTruthy();
      expect(this.view._stateModel.get('modalEnabled')).toBeFalsy();
    });

    it('should toggle the set button state', function () {
      this.view._stateModel.set('modalEnabled', true);
      expect(this.view.$('.js-add').hasClass('is-disabled')).toBeFalsy();
      this.view._stateModel.set('modalEnabled', false);
      expect(this.view.$('.js-add').hasClass('is-disabled')).toBeTruthy();
    });

    it('should toggle the set button state when there\'s no image selected', function () {
      this.view._selectedAsset.set('url', 'batman.png');
      expect(this.view.$('.js-add').hasClass('is-disabled')).toBeFalsy();
      expect(this.view._stateModel.get('modalEnabled')).toBeTruthy();

      this.view._selectedAsset.set('url', '');
      expect(this.view.$('.js-add').hasClass('is-disabled')).toBeTruthy();
      expect(this.view._stateModel.get('modalEnabled')).toBeFalsy();
    });

    it('should render disclaimer', function () {
      expect(this.view.$el.text()).toContain('assets.maki-icons.disclaimer');
    });
  });

  describe('._initSetButtonState', function () {
    beforeEach(function () {
      this._userModel.getOrganization = function () {
        return new Backbone.Model({ id: 1 });
      };

      this._userModel.isInsideOrg = function () {
        return true;
      };

      this.view = new AssetsView({
        model: this.model,
        modalModel: {
          destroy: function () {}
        },
        configModel: this._configModel,
        userModel: this._userModel
      });

      this.view.render();
    });

    it('should return nothing if there\'s no image selected', function () {
      this.view.model.set('image', null);
      expect(this.view._initSetButtonState()).toBeUndefined();
    });

    it('should enable the button if a marker is set', function () {
      this.model.set({ image: 'hi.png', kind: 'marker' });
      this.view._initSetButtonState();

      expect(this.view.$('.js-add').hasClass('is-disabled')).toBeFalsy();
      expect(this.view._stateModel.get('modalEnabled')).toBeTruthy();
    });

    it('should enable the button if a user icon is set', function () {
      this.model.set({ image: 'hi.png', kind: 'custom-marker' });
      this.view._userAssetCollection.add({ public_url: 'hi.png' });

      this.view._initSetButtonState();

      expect(this.view.$('.js-add').hasClass('is-disabled')).toBeFalsy();
      expect(this.view._stateModel.get('modalEnabled')).toBeTruthy();
    });

    it('should enable the button if an org icon is set', function () {
      this.model.set({ image: 'hi.png', kind: 'custom-marker' });
      this.view._organizationAssetCollection.add({ public_url: 'hi.png' });

      this.view._initSetButtonState();

      expect(this.view.$('.js-add').hasClass('is-disabled')).toBeFalsy();
      expect(this.view._stateModel.get('modalEnabled')).toBeTruthy();
    });

    afterEach(function () {
      this.view.clean();
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

    it('should render the new uploaded file and go to the uploads tab', function () {
      mockCreate.call(this, 'success');
      spyOn(this.view, '_getSelectedFiles').and.returnValue(['file.png']);

      this.view.$('.js-fileInput').trigger('change');
      expect(this.view.$('.AssetsList-item').length).toBe(2);
      expect(this.view._assetsTabPaneView.getSelectedTabPane().get('name')).toBe('your-uploads');
    });
  });

  describe('._onAssetUploadError', function () {
    beforeEach(function () {
      mockCreate.call(this, 'error');
      spyOn(this.view, '_getSelectedFiles').and.returnValue(files);
      spyOn(this.view, '_resetFileSelection');
      this.view.$('.js-fileInput').trigger('change');
    });

    it('should reset selection', function () {
      expect(this.view._resetFileSelection).toHaveBeenCalled();
    });

    it('should show the proper error message', function () {
      expect(this.view._stateModel.get('error_message')).toBe('hi, I am an error');
      expect(this.view._stateModel.get('status')).toBe('error');
    });

    it('should remove the model from _userAssetCollection', function () {
      expect(this.view._userAssetCollection.length).toBe(0);
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

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    createCalls = [];
    this.view.clean();
  });
});
