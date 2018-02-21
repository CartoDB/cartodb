var Backbone = require('backbone');
var ConfigModel = require('builder/data/config-model');
var UserModel = require('builder/data/user-model');
var UploadAssetsTab = require('builder/components/form-components/editors/fill/input-color/assets-picker/upload-assets-tab');

describe('components/form-components/editors/fill/input-color/assets-picker/upoad-assets-tab', function () {
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

  describe('._onClickSubmit', function () {
    it('should trigger an event', function () {
      var uploadURLEvent;
      var uploadURLEventData;

      this.view.bind('upload-url', function (data) {
        uploadURLEvent = true;
        uploadURLEventData = data;
      }, this);

      var url = 'http://carto.com/pizza.png';
      this.view.$('.js-url').val(url);
      this.view.$('.js-submit').click();

      expect(uploadURLEvent).toBeTruthy();
      expect(uploadURLEventData).toBe(url);
    });
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
  });
});
