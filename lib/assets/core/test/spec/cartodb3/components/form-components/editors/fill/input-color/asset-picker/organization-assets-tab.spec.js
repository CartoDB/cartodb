var Backbone = require('backbone');
var ConfigModel = require('../../../../../../../../../javascripts/cartodb3/data/config-model');
var UserModel = require('../../../../../../../../../javascripts/cartodb3/data/user-model');
var OrganizationAssetsView = require('../../../../../../../../../javascripts/cartodb3/components/form-components/editors/fill/input-color/assets-picker/organization-assets-tab');

describe('components/form-components/editors/fill/input-color/assets-picker/organization-assets-tab', function () {
  beforeEach(function () {
    // var configModel = new ConfigModel({
    //   base_url: '/u/pepe'
    // });

    // var userModel = new UserModel({}, {
    //   configModel: configModel
    // });

    // this.view = new OrganizationAssetsView({
    //   model: this.model,
    //   selectedAsset: this._selectedAsset,
    //   title: _t('components.modals.add-asset.organization-uploads-uploads'),
    //   organizationAssetCollection: this._organizationAssetCollection,
    //   userAssetCollection: this._userAssetCollection
    // });
    // this.view.render();
  });

  it('should render', function () {
    // expect(this.view.$el.text()).toContain('components.modals.assets-picker.upload-desc');
    // expect(this.view.$el.text()).toContain('components.modals.assets-picker.submit');
    // expect(this.view.$el.text()).toContain('components.modals.assets-picker.upload-file-url');
  });

  describe('._onFileSelected', function () {
    it('should trigger an event', function () {
      // var uploadEvent;
      // var uploadEventData;

      // var files = ['file1', 'file2'];

      // spyOn(this.view, '_getSelectedFiles').and.returnValue(files);

      // this.view.bind('upload-files', function (data) {
      //   uploadEvent = true;
      //   uploadEventData = data;
      // }, this);

      // this.view.$('.js-fileInput').trigger('change');

      // expect(uploadEvent).toBeTruthy();
      // expect(uploadEventData).toBe(files);
    });
  });

  describe('._onClickSubmit', function () {
    it('should trigger an event', function () {
      // var uploadURLEvent;
      // var uploadURLEventData;

      // this.view.bind('upload-url', function (data) {
      //   uploadURLEvent = true;
      //   uploadURLEventData = data;
      // }, this);

      // var url = 'http://carto.com/pizza.png';
      // this.view.$('.js-url').val(url);
      // this.view.$('.js-submit').click();

      // expect(uploadURLEvent).toBeTruthy();
      // expect(uploadURLEventData).toBe(url);
    });
  });

  afterEach(function () {
    // this.view.clean();
  });
});
