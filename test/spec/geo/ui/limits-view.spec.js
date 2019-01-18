var $ = require('jquery');
var _ = require('underscore');
var LimitsView = require('../../../../src/geo/ui/limits/limits-view');
var Map = require('../../../../src/geo/map');

describe('geo/ui/limits', function () {
  beforeEach(function () {
    // Disable defer
    spyOn(_, 'delay').and.callFake(function (func) {
      return function () {
        func.apply(this, arguments);
      };
    });

    this.keyEsc = function () {
      var event = $.Event('keydown');
      event.keyCode = 27; // ESC
      $(document).trigger(event);
    };

    this.map = new Map(null, {
      layersFactory: {}
    });
    spyOn(this.map, 'bind').and.callThrough();
    spyOn(LimitsView.prototype, 'render').and.callThrough();

    this.view = new LimitsView({
      map: this.map
    });
    this.view.render();
    this.$button = this.view.$('.js-button');
    this.$text = this.view.$('.js-text');
    this.viewHasClass = function (className) {
      return this.view.$el.hasClass(className);
    };
  });

  describe('render', function () {
    it('should render properly', function () {
      expect(this.$button.length).toBe(1);
      expect(this.$text.length).toBe(1);
    });
  });

  describe('when the limits overlay is displayed', function () {
    beforeEach(function () {
      this.$button.click();
    });

    it('should have .is-active class', function () {
      expect(this.viewHasClass('is-active')).toBeTruthy();
    });

    it('should hide the overlay when .js-button is clicked', function () {
      this.$button.click();
      expect(this.viewHasClass('is-active')).toBeFalsy();
    });

    it('should hide the overlay when ESC is pressed', function () {
      this.keyEsc();
      expect(this.viewHasClass('is-active')).toBeFalsy();
    });

    it('should hide the overlay when user clicks on the document', function () {
      $(document).trigger('click');
      expect(this.viewHasClass('is-active')).toBeFalsy();
    });
  });

  describe('when the limits overlay is hidden', function () {
    beforeEach(function () {
      this.$button.click();
      this.keyEsc();
    });

    it('should not have .is-active class', function () {
      expect(this.viewHasClass('is-active')).toBeFalsy();
    });

    it('should show the overlay when js-button is clicked', function () {
      this.$button.click();
      expect(this.viewHasClass('is-active')).toBeTruthy();
    });

    it('should ignore the ESC key', function () {
      this.keyEsc();
      expect(this.viewHasClass('is-active')).toBeFalsy();
    });

    it('should ignore clicks in the document', function () {
      $(document).trigger('click');
      expect(this.viewHasClass('is-active')).toBeFalsy();
    });
  });
});
