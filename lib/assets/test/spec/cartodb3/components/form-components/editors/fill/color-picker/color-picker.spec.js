var ColorPicker = require('../../../../../../../../javascripts/cartodb3/components/form-components/editors/fill/color-picker/color-picker');

describe('components/form-components/editors/fill/color-picker/color-picker', function () {
  describe('with opacity', function () {
    beforeEach(function () {
      this.view = new ColorPicker({
        value: '#A6CEE3',
        opacity: 0.5
      });

      this.view.render();
    });

    it('should get render', function () {
      expect(this.view.$('.js-hex').val()).toBe('#A6CEE3');
      expect(this.view.$('.js-r').val()).toBe('166');
      expect(this.view.$('.js-g').val()).toBe('206');
      expect(this.view.$('.js-b').val()).toBe('227');
      expect(this.view.$('.js-a').val()).toBe('0.5');
    });

    afterEach(function () {
      this.view.remove();
    });
  });

  describe('withouth opacity', function () {
    beforeEach(function () {
      this.view = new ColorPicker({
        value: '#A6CEE3',
        opacity: 0.5,
        disableOpacity: true
      });

      this.view.render();
    });

    it('should disable the opacity selector', function () {
      expect(this.view.$('.js-a').val()).toBe('0.5');
      expect(this.view.$('.js-a').hasClass('is-disabled')).toBe(true);
      expect(this.view.$('.js-colorPicker .js-alpha').hasClass('is-hidden')).toBe(true);
    });

    afterEach(function () {
      this.view.remove();
    });
  });
});
