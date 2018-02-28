var InputAssetPickerView = require('builder/components/form-components/editors/fill/input-color/assets-picker/input-asset-picker-view');
var UserModel = require('builder/data/user-model');
var ConfigModel = require('builder/data/config-model');
var FactoryModals = require('../../../../../../factories/modals');
var Backbone = require('backbone');

describe('components/form-components/editors/fill/input-color/assets-picker/input-asset-picker-view', function () {
  beforeEach(function () {
    this.userModel = new UserModel({
      username: 'pepe'
    }, {
      configModel: 'c'
    });

    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.model = new Backbone.Model({
      ramp: [{
        color: '#FABADA',
        title: 'hola',
        image: 'http://www.image.com/image.jpg'
      }]
    });

    this.view = new InputAssetPickerView({
      index: 0,
      ramp: [{
        color: '#FABADA',
        title: 'hola',
        image: 'http://www.image.com/image.jpg'
      }],
      userModel: this.userModel,
      configModel: this.configModel,
      modals: FactoryModals.createModalService()
    });

    this.view.render();
  });

  describe('render', function () {
    it('should render _headerView', function () {
      expect(this.view._headerView).toBeDefined();
    });

    it('should render _assetPicker', function () {
      expect(this.view._assetPicker).toBeDefined();
    });
  });

  describe('._getRampItem', function () {
    it('should return ramp item element', function () {
      var item = this.view._getRampItem();
      expect(item.color).toBe('#FABADA');
    });
  });

  describe('._onChangeImage', function () {
    it('should trigger change:image on view and model', function () {
      this.view._onChangeImage({ url: 'new_image' });

      expect(this.view.options.ramp[0].image).toBe('new_image');
      expect(this.view.model.get('ramp')[0].image).toBe('new_image');
    });
  });

  describe('._onClickBack', function () {
    it('should trigger back function', function () {
      var isBack;

      this.view._headerView.bind('back', function () {
        isBack = true;
      }, this);

      this.view._headerView.$('.js-back').click();
      expect(isBack).toBeTruthy();
    });
  });

  describe('._onGoToColorPicker', function () {
    it('should trigger goToColorPicker function', function () {
      var isInColorPicker;

      this.view._headerView.bind('goToColorPicker', function () {
        isInColorPicker = true;
      }, this);

      this.view._headerView.$('.js-colorPicker').click();
      expect(isInColorPicker).toBeTruthy();
    });
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
  });
});
