var Backbone = require('backbone');
var InputAssetPickerHeader = require('builder/components/form-components/editors/fill/input-color/assets-picker/input-asset-picker-header');

describe('components/form-components/editors/fill/input-color/assets-picker/input-asset-picker-header', function () {
  beforeEach(function () {
    this.model = new Backbone.Model({
      index: 0,
      ramp: [{
        color: '#FF0000',
        title: 'hola',
        image: 'http://www.image.com/image.jpg'
      }]
    });

    this.view = new InputAssetPickerHeader({
      index: 0,
      model: this.model
    });

    this.view.render();
  });

  describe('render', function () {
    it('should render template', function () {
      expect(this.view.$el.html()).toContain('CDB-Box-modalHeader');
    });
  });

  describe('.getRampItem', function () {
    it('should return ramp item element', function () {
      var item = this.view._getRampItem();
      expect(item.color).toBe('#FF0000');
    });
  });

  describe('._onClickBack', function () {
    it('should trigger back function', function () {
      var isBack;

      this.view.bind('back', function () {
        isBack = true;
      }, this);

      this.view.$('.js-back').click();
      expect(isBack).toBeTruthy();
    });
  });

  describe('._onGoToColorPicker', function () {
    it('should trigger goToColorPicker function', function () {
      var isInColorPicker;

      this.view.bind('goToColorPicker', function () {
        isInColorPicker = true;
      }, this);

      this.view.$('.js-colorPicker').click();
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
