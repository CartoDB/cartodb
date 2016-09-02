var $ = require('jquery');
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

    it('should change the hex color directly', function () {
      this.view.$('.js-hex').val('#CCC');
      var e = $.Event('keyup');
      e.which = 37;
      this.view.$('.js-hex').trigger(e);

      expect(this.view.model.get('hex')).toBe('#cccccc');
    });

    it('should change each color individually', function () {
      this.view.$('.js-r').val('10');
      this.view.$('.js-g').val('20');
      this.view.$('.js-b').val('30');
      var e = $.Event('keyup');
      e.which = 37;
      this.view.$('.js-r').trigger(e);

      expect(this.view.model.get('hex')).toBe('#0a141e');
    });

    it('should change each the alpha', function () {
      this.view.$('.js-a').val('0.7');
      var e = $.Event('keyup');
      e.which = 37;
      this.view.$('.js-a').trigger(e);

      expect(this.view.model.get('opacity')).toBe(0.7);
    });

    it('should show the errors', function () {
      this.view.$('.js-r').val('10');
      this.view.$('.js-g').val('20');
      this.view.$('.js-b').val('what?');
      var e = $.Event('keyup');
      e.which = 37;
      this.view.$('.js-b').trigger(e);

      expect(this.view.model.get('hex')).toBe('#A6CEE3');
      expect(this.view.$('.js-b').hasClass('has-error')).toBeTruthy();
    });

    afterEach(function () {
      this.view.remove();
    });
  });
});
