var Backbone = require('backbone');
var InputAssetPickerHeader = require('../../../../../../../../../javascripts/cartodb3/components/form-components/editors/fill/input-color/assets-picker/input-asset-picker-header');

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
    this.view = new InputAssetPickerHeader({ model: this.model });
  });

  describe('render', function () {
    it('should render template', function () {
      expect(this.view.$el).toContain('CDB-Box-modalHeader');
    });
  });

  describe('._getRampItem', function () {
    it('should return ramp item element', function () {
      var item = this.view._getRampItem();
      expect(item).toBe(0);
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
