var InputAssetPickerView = require('../../../../../../../../../javascripts/cartodb3/components/form-components/editors/fill/input-color/assets-picker/input-asset-picker-view');
var UserModel = require('../../../../../../../../../javascripts/cartodb3/data/user-model');
var ConfigModel = require('../../../../../../../../../javascripts/cartodb3/data/config-model');
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
      options: {
        index: 0
      },
      ramp: [{
        color: '#FABADA',
        title: 'hola',
        image: 'http://www.image.com/image.jpg'
      }]
    });

    this.view = new InputAssetPickerView({
      ramp: [{
        color: '#FABADA',
        title: 'hola',
        image: 'http://www.image.com/image.jpg'
      }],
      userModel: this.userModel,
      configModel: this.configModel,
      modals: {}
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
      expect(item).toBe(0);
    });
  });

  describe('._onChangeImage', function () {
    it('should trigger change:image on view and model', function () {
    });
  });

  describe('._onClickBack', function () {
    it('should trigger back function', function () {

    });
  });

  describe('._onGoToColorPicker', function () {
    it('should trigger goToColorPicker function', function () {

    });
  });
});
